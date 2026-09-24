alter table public.inventario_giacenze alter column spesa_totale drop not null;
alter table public.inventario_movimenti alter column spesa drop default;
alter table public.inventario_movimenti alter column spesa drop not null;

-- Orders recorded before order costs were collected have an unknown cost.
update public.inventario_movimenti
set spesa = null
where tipo = 'ordine' and spesa = 0;

update public.inventario_giacenze
set spesa_totale = case
  when exists (select 1 from public.inventario_movimenti where tipo = 'ordine' and spesa is null) then null
  else coalesce((select sum(spesa) from public.inventario_movimenti where tipo = 'ordine'), 0)
end
where id = 1;

drop policy if exists inventario_movimenti_insert_order on public.inventario_movimenti;
create policy inventario_movimenti_insert_order on public.inventario_movimenti
  for insert to authenticated with check (
    public.is_tapnfc_operator()
    and tipo in ('apertura','ordine')
    and targhe >= 0 and carte >= 0 and adesivi >= 0
    and spesa is not null and spesa >= 0
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

revoke update on public.inventario_movimenti from authenticated;
grant update (spesa) on public.inventario_movimenti to authenticated;
drop policy if exists inventario_movimenti_update_order_spend on public.inventario_movimenti;
create policy inventario_movimenti_update_order_spend on public.inventario_movimenti
  for update to authenticated
  using (public.is_tapnfc_operator() and tipo = 'ordine')
  with check (public.is_tapnfc_operator() and tipo = 'ordine' and spesa is not null and spesa >= 0);

create or replace function public.ricalcola_spesa_inventario()
returns trigger language plpgsql security definer set search_path = '' as $function$
begin
  update public.inventario_giacenze
  set spesa_totale = case
    when exists (select 1 from public.inventario_movimenti where tipo = 'ordine' and spesa is null) then null
    else coalesce((select sum(spesa) from public.inventario_movimenti where tipo = 'ordine'), 0)
  end,
  updated_at = now()
  where id = 1;
  return new;
end;
$function$;
drop trigger if exists inventario_ricalcola_spesa on public.inventario_movimenti;
create trigger inventario_ricalcola_spesa after update of spesa on public.inventario_movimenti
  for each row when (old.spesa is distinct from new.spesa)
  execute function public.ricalcola_spesa_inventario();

create or replace function public.applica_movimento_inventario()
returns trigger language plpgsql security definer set search_path = '' as $function$
begin
  update public.inventario_giacenze
  set targhe = targhe + new.targhe,
      carte = carte + new.carte,
      adesivi = adesivi + new.adesivi,
      spesa_totale = case
        when exists (select 1 from public.inventario_movimenti where tipo = 'ordine' and spesa is null) then null
        else coalesce(spesa_totale, 0) + case when new.tipo = 'ordine' then coalesce(new.spesa, 0) else 0 end
      end,
      updated_at = now()
  where id = 1
    and targhe + new.targhe >= 0
    and carte + new.carte >= 0
    and adesivi + new.adesivi >= 0;
  if not found then
    raise exception using errcode = 'P0001',
      message = 'Scorte insufficienti: riduci le quantità della vendita oppure registra prima un ordine.';
  end if;
  return new;
end;
$function$;
