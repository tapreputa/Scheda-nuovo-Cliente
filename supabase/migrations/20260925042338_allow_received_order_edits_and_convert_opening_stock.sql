-- Let operators edit receipt date, quantities, and spend on received orders.
-- Keep the stock balance synchronized by applying only the quantity delta.
create or replace function public.ricalcola_modifica_ordine_inventario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if old.tipo <> 'ordine' or new.tipo <> 'ordine' then
    raise exception using errcode = '42501', message = 'Si possono modificare solo gli ordini ricevuti.';
  end if;

  update public.inventario_giacenze
  set targhe = targhe + (new.targhe - old.targhe),
      carte = carte + (new.carte - old.carte),
      adesivi = adesivi + (new.adesivi - old.adesivi),
      updated_at = now()
  where id = 1
    and targhe + (new.targhe - old.targhe) >= 0
    and carte + (new.carte - old.carte) >= 0
    and adesivi + (new.adesivi - old.adesivi) >= 0;

  if not found then
    raise exception using errcode = 'P0001',
      message = 'Modifica non possibile: le quantità porterebbero una o più scorte sotto zero.';
  end if;
  return new;
end;
$function$;

drop trigger if exists inventario_ricalcola_modifica_ordine on public.inventario_movimenti;
create trigger inventario_ricalcola_modifica_ordine
after update of targhe, carte, adesivi on public.inventario_movimenti
for each row
when (old.tipo = 'ordine' and new.tipo = 'ordine'
  and (old.targhe is distinct from new.targhe
    or old.carte is distinct from new.carte
    or old.adesivi is distinct from new.adesivi))
execute function public.ricalcola_modifica_ordine_inventario();

revoke update on public.inventario_movimenti from authenticated;
revoke update (data_movimento, targhe, carte, adesivi, spesa) on public.inventario_movimenti from authenticated;
grant update (data_movimento, targhe, carte, adesivi, spesa) on public.inventario_movimenti to authenticated;

drop policy if exists inventario_movimenti_update_order_spend on public.inventario_movimenti;
create policy inventario_movimenti_update_order_spend on public.inventario_movimenti
for update to authenticated
using (public.is_tapnfc_operator() and tipo = 'ordine')
with check (
  public.is_tapnfc_operator()
  and tipo = 'ordine'
  and targhe >= 0 and carte >= 0 and adesivi >= 0
  and (targhe > 0 or carte > 0 or adesivi > 0)
  and (spesa is null or spesa >= 0)
);

-- The recorded opening stock is historical stock received; keep its quantities
-- unchanged and let the UI request its actual cost instead of assuming zero.
update public.inventario_movimenti
set tipo = 'ordine', spesa = null
where tipo = 'apertura';
