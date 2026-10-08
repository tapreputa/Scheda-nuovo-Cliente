create table public.manual_logo_pages (
  slug text primary key check (slug ~ '^[a-z0-9-]{1,80}$'),
  html text not null check (octet_length(html) between 1 and 15000000),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.manual_logo_pages enable row level security;
grant select,insert,update on public.manual_logo_pages to authenticated;
create policy manual_logo_owner_select on public.manual_logo_pages for select to authenticated
using (public.is_tapnfc_operator() and created_by=auth.uid());
create policy manual_logo_owner_insert on public.manual_logo_pages for insert to authenticated
with check (public.is_tapnfc_operator() and created_by=auth.uid());
create policy manual_logo_owner_update on public.manual_logo_pages for update to authenticated
using (public.is_tapnfc_operator() and created_by=auth.uid())
with check (public.is_tapnfc_operator() and created_by=auth.uid());

-- Trigger-only guard: a new manual page can never take over a legacy slug.
create function public.guard_manual_logo_page() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' and not exists (select 1 from public.manual_logo_pages m where m.slug=new.slug) and (
    exists (select 1 from public.clienti c where substring(c.link_nfc from '[?&]c=([^&]+)')=new.slug)
    or exists (select 1 from public.potenziali_clienti p where substring(p.link_nfc from '[?&]c=([^&]+)')=new.slug)
  ) then
    raise exception 'Attività già esistente: la sua pagina è protetta. Usa la scheda esistente.';
  end if;
  return new;
end $$;
revoke all on function public.guard_manual_logo_page() from public,anon,authenticated;
create trigger guard_manual_logo_page before insert on public.manual_logo_pages
for each row execute function public.guard_manual_logo_page();

-- Public lookup exposes only the deliberately published page, not operator data.
create function public.get_public_manual_logo_page(p_slug text)
returns table(html text) language sql stable security definer set search_path='' as $$
  select m.html from public.manual_logo_pages m where m.slug=p_slug
    and p_slug ~ '^[a-z0-9-]{1,80}$' limit 1;
$$;
revoke all on function public.get_public_manual_logo_page(text) from public;
grant execute on function public.get_public_manual_logo_page(text) to anon,authenticated;

CREATE OR REPLACE FUNCTION public.register_nfc_tap(p_link_nfc text)
 RETURNS TABLE(client_id uuid, target_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_client public.clienti%rowtype;
  v_potential public.potenziali_clienti%rowtype;
  v_slug text;
  v_source text;
begin
  v_slug := substring(coalesce(p_link_nfc, '') from '[?&]c=([^&]+)');
  if v_slug is null or char_length(v_slug) > 80 or v_slug !~ '^[a-z0-9-]+$' then
    return;
  end if;

  v_source := lower(coalesce(substring(p_link_nfc from '[?&]src=([^&]+)'), 'legacy'));
  if v_source not in ('nfc', 'link', 'legacy', 'qr') then
    v_source := 'link';
  end if;

  select * into v_client from public.clienti c
  where substring(c.link_nfc from '[?&]c=([^&]+)') = v_slug
  limit 1;

  if v_client.id is not null then
    insert into public.nfc_taps(client_id, event_type, source)
    values (v_client.id, 'open', v_source);

    if exists (select 1 from public.manual_logo_pages m where m.slug = v_slug) then
      target_url := 'https://tapreputa.github.io/Scheda-nuovo-Cliente/manual-logo.html?c=' || v_slug;
    elsif coalesce(v_client.categoria_codice, '') = 'standard' then
      target_url := v_client.link_recensioni;
    else
      target_url := 'https://tapreputa.github.io/Scheda-nuovo-Cliente/cliente.html?c='
        || v_slug || '&src=' || v_source;
    end if;
    client_id := v_client.id;
    return next;
    return;
  end if;

  select * into v_potential from public.potenziali_clienti p
  where p.stato = 'potenziale'
    and substring(p.link_nfc from '[?&]c=([^&]+)') = v_slug
  limit 1;

  if v_potential.id is null then
    return;
  end if;

  if exists (select 1 from public.manual_logo_pages m where m.slug = v_slug) then
    target_url := 'https://tapreputa.github.io/Scheda-nuovo-Cliente/manual-logo.html?c=' || v_slug;
  elsif coalesce(v_potential.categoria_codice, '') = 'standard' then
    target_url := v_potential.link_recensioni;
  else
    target_url := 'https://tapreputa.github.io/Scheda-nuovo-Cliente/demo.html?t='
      || v_potential.preview_token::text || '&v=20261008-logo-surface1';
  end if;
  if nullif(target_url, '') is null then
    return;
  end if;

  client_id := null;
  return next;
end;
$function$;

