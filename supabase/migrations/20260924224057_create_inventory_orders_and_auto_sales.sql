create table if not exists public.inventario_giacenze (
  id smallint primary key default 1 check (id = 1),
  targhe integer not null default 0 check (targhe >= 0),
  carte integer not null default 0 check (carte >= 0),
  adesivi integer not null default 0 check (adesivi >= 0),
  updated_at timestamptz not null default now()
);
insert into public.inventario_giacenze (id) values (1) on conflict (id) do nothing;

create table if not exists public.inventario_movimenti (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('apertura','ordine','vendita','rettifica_vendita','storno_vendita')),
  data_movimento date not null default current_date,
  targhe integer not null default 0,
  carte integer not null default 0,
  adesivi integer not null default 0,
  operatore text not null check (operatore in ('Francesco','Gisberto','Enzo')),
  note text,
  source_client_id uuid references public.clienti(id) on delete set null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint inventario_movimenti_non_vuoti check (
    tipo = 'apertura' or targhe <> 0 or carte <> 0 or adesivi <> 0
  )
);
create unique index if not exists inventario_movimenti_una_apertura
  on public.inventario_movimenti (tipo) where tipo = 'apertura';
create index if not exists inventario_movimenti_data_idx
  on public.inventario_movimenti (data_movimento desc, created_at desc);
create index if not exists inventario_movimenti_cliente_idx
  on public.inventario_movimenti (source_client_id) where source_client_id is not null;

alter table public.inventario_giacenze enable row level security;
alter table public.inventario_movimenti enable row level security;
drop policy if exists inventario_giacenze_select_team on public.inventario_giacenze;
create policy inventario_giacenze_select_team on public.inventario_giacenze
  for select to authenticated using (public.is_tapnfc_operator());
drop policy if exists inventario_movimenti_select_team on public.inventario_movimenti;
create policy inventario_movimenti_select_team on public.inventario_movimenti
  for select to authenticated using (public.is_tapnfc_operator());
drop policy if exists inventario_movimenti_insert_order on public.inventario_movimenti;
create policy inventario_movimenti_insert_order on public.inventario_movimenti
  for insert to authenticated with check (
    public.is_tapnfc_operator()
    and tipo in ('apertura','ordine')
    and targhe >= 0 and carte >= 0 and adesivi >= 0
    and created_by = auth.uid()
    and operatore = case lower(auth.jwt() ->> 'email')
      when 'francesco@tapnfc.local' then 'Francesco'
      when 'gisberto@tapnfc.local' then 'Gisberto'
      when 'enzo@tapnfc.local' then 'Enzo'
      else ''
    end
    and (tipo <> 'ordine' or targhe > 0 or carte > 0 or adesivi > 0)
  );
grant select on public.inventario_giacenze to authenticated;
grant select, insert on public.inventario_movimenti to authenticated;

create or replace function public.applica_movimento_inventario()
returns trigger language plpgsql security definer set search_path = '' as $function$
begin
  update public.inventario_giacenze
  set targhe = targhe + new.targhe,
      carte = carte + new.carte,
      adesivi = adesivi + new.adesivi,
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
drop trigger if exists inventario_applica_movimento on public.inventario_movimenti;
create trigger inventario_applica_movimento after insert on public.inventario_movimenti
  for each row execute function public.applica_movimento_inventario();

create or replace function public.registra_vendita_cliente_inventario()
returns trigger language plpgsql security definer set search_path = '' as $function$
declare
  d_targhe integer;
  d_carte integer;
  d_adesivi integer;
  totale_targhe integer;
  totale_carte integer;
  totale_adesivi integer;
begin
  if tg_op = 'INSERT' then
    d_targhe := -coalesce(new.targhe, 0);
    d_carte := -coalesce(new.carte, 0);
    d_adesivi := -coalesce(new.adesivi, 0);
    if d_targhe = 0 and d_carte = 0 and d_adesivi = 0 then return new; end if;
    insert into public.inventario_movimenti
      (tipo, data_movimento, targhe, carte, adesivi, operatore, note, source_client_id, created_by)
    values ('vendita', coalesce(new.created_at::date, current_date), d_targhe, d_carte, d_adesivi,
      coalesce(new.operatore, 'Francesco'), left('Vendita cliente: ' || coalesce(new.nome,''), 180),
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
drop trigger if exists clienti_inventario_insert on public.clienti;
create trigger clienti_inventario_insert after insert on public.clienti
  for each row execute function public.registra_vendita_cliente_inventario();
drop trigger if exists clienti_inventario_update on public.clienti;
create trigger clienti_inventario_update after update of targhe, carte, adesivi on public.clienti
  for each row execute function public.registra_vendita_cliente_inventario();
drop trigger if exists clienti_inventario_delete on public.clienti;
create trigger clienti_inventario_delete before delete on public.clienti
  for each row execute function public.registra_vendita_cliente_inventario();
