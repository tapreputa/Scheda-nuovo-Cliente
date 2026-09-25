-- Restrict order edits and deletion to Francesco, and keep balances correct on deletion.
create or replace function public.ricalcola_eliminazione_ordine_inventario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if old.tipo <> 'ordine' then
    raise exception using errcode = '42501', message = 'Si possono eliminare solo gli ordini ricevuti.';
  end if;

  update public.inventario_giacenze
  set targhe = targhe - old.targhe,
      carte = carte - old.carte,
      adesivi = adesivi - old.adesivi,
      updated_at = now()
  where id = 1
    and targhe - old.targhe >= 0
    and carte - old.carte >= 0
    and adesivi - old.adesivi >= 0;

  if not found then
    raise exception using errcode = 'P0001',
      message = 'Ordine non eliminabile: una o più quantità sono già state vendute e porterebbero la scorta sotto zero.';
  end if;
  return old;
end;
$function$;

drop trigger if exists inventario_rimuovi_ordine on public.inventario_movimenti;
create trigger inventario_rimuovi_ordine
after delete on public.inventario_movimenti
for each row
when (old.tipo = 'ordine')
execute function public.ricalcola_eliminazione_ordine_inventario();

drop trigger if exists inventario_ricalcola_spesa_eliminazione on public.inventario_movimenti;
create trigger inventario_ricalcola_spesa_eliminazione
after delete on public.inventario_movimenti
for each row
when (old.tipo = 'ordine')
execute function public.ricalcola_spesa_inventario();

drop policy if exists inventario_movimenti_update_order_spend on public.inventario_movimenti;
create policy inventario_movimenti_update_order_spend on public.inventario_movimenti
for update to authenticated
using (public.is_tapnfc_operator() and tipo = 'ordine'
  and lower(auth.jwt() ->> 'email') = 'francesco@tapnfc.local')
with check (
  public.is_tapnfc_operator()
  and tipo = 'ordine'
  and lower(auth.jwt() ->> 'email') = 'francesco@tapnfc.local'
  and targhe >= 0 and carte >= 0 and adesivi >= 0
  and (targhe > 0 or carte > 0 or adesivi > 0)
  and (spesa is null or spesa >= 0)
);

revoke delete on public.inventario_movimenti from authenticated;
grant delete on public.inventario_movimenti to authenticated;
drop policy if exists inventario_movimenti_delete_order on public.inventario_movimenti;
create policy inventario_movimenti_delete_order on public.inventario_movimenti
for delete to authenticated
using (
  public.is_tapnfc_operator()
  and tipo = 'ordine'
  and lower(auth.jwt() ->> 'email') = 'francesco@tapnfc.local'
);
