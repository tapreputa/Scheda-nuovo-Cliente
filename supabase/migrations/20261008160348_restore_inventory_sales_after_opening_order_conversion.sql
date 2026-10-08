-- The first physical stock was converted from "apertura" to "ordine".
-- Use its insertion time as the boundary for new sales; legacy clients were
-- already reflected in the opening physical count.
create or replace function public.registra_vendita_cliente_inventario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  stock_started_at timestamptz;
  d_targhe integer;
  d_carte integer;
  d_adesivi integer;
  totale_targhe integer;
  totale_carte integer;
  totale_adesivi integer;
  cliente_tracciato boolean;
  tipo_movimento text;
begin
  select min(created_at) into stock_started_at
  from public.inventario_movimenti
  where tipo in ('apertura', 'ordine');

  if stock_started_at is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.created_at < stock_started_at then return new; end if;
    d_targhe := -coalesce(new.targhe, 0);
    d_carte := -coalesce(new.carte, 0);
    d_adesivi := -coalesce(new.adesivi, 0);
    if d_targhe = 0 and d_carte = 0 and d_adesivi = 0 then return new; end if;

    insert into public.inventario_movimenti
      (tipo, data_movimento, targhe, carte, adesivi, operatore, note, source_client_id, created_by)
    values ('vendita', (new.created_at at time zone 'Europe/Rome')::date,
      d_targhe, d_carte, d_adesivi, new.operatore,
      left('Vendita cliente: ' || coalesce(new.nome, ''), 180),
      new.id, coalesce(auth.uid(), new.created_by));
    return new;
  elsif tg_op = 'UPDATE' then
    select exists (
      select 1 from public.inventario_movimenti
      where source_client_id = old.id and tipo in ('vendita', 'rettifica_vendita')
    ) into cliente_tracciato;

    if not cliente_tracciato and old.created_at < stock_started_at then return new; end if;
    if cliente_tracciato then
      d_targhe := coalesce(old.targhe, 0) - coalesce(new.targhe, 0);
      d_carte := coalesce(old.carte, 0) - coalesce(new.carte, 0);
      d_adesivi := coalesce(old.adesivi, 0) - coalesce(new.adesivi, 0);
      tipo_movimento := 'rettifica_vendita';
    else
      -- A post-opening client may have been inserted with zero quantities,
      -- or while the historical trigger was disabled by the renamed opening.
      d_targhe := -coalesce(new.targhe, 0);
      d_carte := -coalesce(new.carte, 0);
      d_adesivi := -coalesce(new.adesivi, 0);
      tipo_movimento := 'vendita';
    end if;
    if d_targhe = 0 and d_carte = 0 and d_adesivi = 0 then return new; end if;

    insert into public.inventario_movimenti
      (tipo, data_movimento, targhe, carte, adesivi, operatore, note, source_client_id, created_by)
    values (tipo_movimento, (now() at time zone 'Europe/Rome')::date,
      d_targhe, d_carte, d_adesivi, new.operatore,
      left(case when cliente_tracciato then 'Correzione vendita: ' else 'Vendita cliente: ' end || coalesce(new.nome, ''), 180),
      new.id, coalesce(auth.uid(), new.updated_by, new.created_by));
    return new;
  else
    select coalesce(sum(targhe), 0), coalesce(sum(carte), 0), coalesce(sum(adesivi), 0)
    into totale_targhe, totale_carte, totale_adesivi
    from public.inventario_movimenti where source_client_id = old.id;
    d_targhe := -totale_targhe;
    d_carte := -totale_carte;
    d_adesivi := -totale_adesivi;
    if d_targhe <> 0 or d_carte <> 0 or d_adesivi <> 0 then
      insert into public.inventario_movimenti
        (tipo, data_movimento, targhe, carte, adesivi, operatore, note, source_client_id, created_by)
      values ('storno_vendita', (now() at time zone 'Europe/Rome')::date,
        d_targhe, d_carte, d_adesivi, old.operatore,
        left('Storno cliente eliminato: ' || coalesce(old.nome, ''), 180),
        old.id, coalesce(auth.uid(), old.updated_by, old.created_by));
    end if;
    return old;
  end if;
end;
$function$;

-- Idempotent reconciliation: only clients added after stock activation and
-- without a sale movement are included. The existing movement trigger applies
-- the subtraction and rejects any negative stock in the same transaction.
with stock_start as (
  select min(created_at) as activated_at from public.inventario_movimenti
  where tipo in ('apertura', 'ordine')
)
insert into public.inventario_movimenti
  (tipo, data_movimento, targhe, carte, adesivi, operatore, note, source_client_id, created_by)
select 'vendita', (c.created_at at time zone 'Europe/Rome')::date,
  -c.targhe, -c.carte, -c.adesivi, c.operatore,
  left('Vendita cliente: ' || coalesce(c.nome, ''), 180),
  c.id, c.created_by
from public.clienti c cross join stock_start s
where s.activated_at is not null
  and c.created_at >= s.activated_at
  and (c.targhe > 0 or c.carte > 0 or c.adesivi > 0)
  and not exists (
    select 1 from public.inventario_movimenti m
    where m.source_client_id = c.id and m.tipo in ('vendita', 'rettifica_vendita')
  );
