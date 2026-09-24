create or replace function public.registra_vendita_cliente_inventario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  d_targhe integer;
  d_carte integer;
  d_adesivi integer;
  totale_targhe integer;
  totale_carte integer;
  totale_adesivi integer;
  movimento_data date;
  nome_cliente text;
begin
  -- Before the physical count is entered, don't interfere with customer flows.
  -- The initial stock will reflect all product already on hand at that time.
  if not exists (select 1 from public.inventario_movimenti where tipo = 'apertura') then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  if tg_op = 'INSERT' then
    d_targhe := -coalesce(new.targhe, 0);
    d_carte := -coalesce(new.carte, 0);
    d_adesivi := -coalesce(new.adesivi, 0);
    movimento_data := coalesce(new.created_at::date, current_date);
    nome_cliente := new.nome;
    if d_targhe = 0 and d_carte = 0 and d_adesivi = 0 then return new; end if;
    insert into public.inventario_movimenti
      (tipo, data_movimento, targhe, carte, adesivi, operatore, note, source_client_id, created_by)
    values ('vendita', movimento_data, d_targhe, d_carte, d_adesivi,
      coalesce(new.operatore, 'Francesco'), left('Vendita cliente: ' || coalesce(nome_cliente,''), 180),
      new.id, coalesce(auth.uid(), new.created_by));
    return new;
  elsif tg_op = 'UPDATE' then
    d_targhe := coalesce(old.targhe,0) - coalesce(new.targhe,0);
    d_carte := coalesce(old.carte,0) - coalesce(new.carte,0);
    d_adesivi := coalesce(old.adesivi,0) - coalesce(new.adesivi,0);
    if d_targhe = 0 and d_carte = 0 and d_adesivi = 0 then return new; end if;
    insert into public.inventario_movimenti
      (tipo, data_movimento, targhe, carte, adesivi, operatore, note, source_client_id, created_by)
    values ('rettifica_vendita', current_date, d_targhe, d_carte, d_adesivi,
      coalesce(new.operatore, 'Francesco'), left('Correzione vendita: ' || coalesce(new.nome,''), 180),
      new.id, coalesce(auth.uid(), new.updated_by, new.created_by));
    return new;
  else
    select coalesce(sum(targhe),0), coalesce(sum(carte),0), coalesce(sum(adesivi),0)
      into totale_targhe, totale_carte, totale_adesivi
      from public.inventario_movimenti where source_client_id = old.id;
    d_targhe := -totale_targhe;
    d_carte := -totale_carte;
    d_adesivi := -totale_adesivi;
    if d_targhe <> 0 or d_carte <> 0 or d_adesivi <> 0 then
      insert into public.inventario_movimenti
        (tipo, data_movimento, targhe, carte, adesivi, operatore, note, source_client_id, created_by)
      values ('storno_vendita', current_date, d_targhe, d_carte, d_adesivi,
        coalesce(old.operatore, 'Francesco'), left('Storno cliente eliminato: ' || coalesce(old.nome,''), 180),
        old.id, coalesce(auth.uid(), old.updated_by, old.created_by));
    end if;
    return old;
  end if;
end;
$function$;
