alter table public.inventario_giacenze
  add column if not exists spesa_totale numeric(12,2) not null default 0
  check (spesa_totale >= 0);

alter table public.inventario_movimenti
  add column if not exists spesa numeric(12,2) not null default 0
  check (spesa >= 0);

drop policy if exists inventario_movimenti_insert_order on public.inventario_movimenti;
create policy inventario_movimenti_insert_order on public.inventario_movimenti
  for insert to authenticated with check (
    public.is_tapnfc_operator()
    and tipo in ('apertura','ordine')
    and targhe >= 0 and carte >= 0 and adesivi >= 0
    and spesa >= 0
    and (tipo = 'ordine' or spesa = 0)
    and created_by = auth.uid()
    and operatore = case lower(auth.jwt() ->> 'email')
      when 'francesco@tapnfc.local' then 'Francesco'
      when 'gisberto@tapnfc.local' then 'Gisberto'
      when 'enzo@tapnfc.local' then 'Enzo'
      else ''
    end
    and (tipo <> 'ordine' or targhe > 0 or carte > 0 or adesivi > 0)
  );

create or replace function public.applica_movimento_inventario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  update public.inventario_giacenze
  set targhe = targhe + new.targhe,
      carte = carte + new.carte,
      adesivi = adesivi + new.adesivi,
      spesa_totale = spesa_totale + case when new.tipo = 'ordine' then new.spesa else 0 end,
      updated_at = now()
  where id = 1
    and targhe + new.targhe >= 0
    and carte + new.carte >= 0
    and adesivi + new.adesivi >= 0;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'Scorte insufficienti: riduci le quantità della vendita oppure registra prima un ordine.';
  end if;
  return new;
end;
$function$;
