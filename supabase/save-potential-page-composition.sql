-- Update an existing prospect's saved page without changing its NFC URL or proposal.
create or replace function public.save_potential_page_composition(
  p_potential_id uuid, p_html text, p_logo_data text default null,
  p_expected_html text default null
)
returns table(link_nfc text)
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_potential public.potenziali_clienti%rowtype;
  v_slug text;
  v_previous text;
begin
  if auth.uid() is null or not public.is_tapnfc_operator() then
    raise exception 'Operatore non autorizzato.';
  end if;
  select p.* into v_potential from public.potenziali_clienti p
    where p.id=p_potential_id for update;
  if v_potential.id is null or v_potential.created_by is distinct from auth.uid()
     or v_potential.stato <> 'potenziale' then
    raise exception 'Potenziale non disponibile o non modificabile.';
  end if;
  if v_potential.categoria_codice='standard' then
    raise exception 'Questo potenziale usa il link diretto a Google.';
  end if;
  v_slug:=substring(v_potential.link_nfc from '[?&]c=([^&]+)');
  if v_slug is null or v_slug !~ '^[a-z0-9-]{1,80}$' then
    raise exception 'Link potenziale non valido.';
  end if;
  if exists(select 1 from public.clienti c
    where substring(c.link_nfc from '[?&]c=([^&]+)')=v_slug) then
    raise exception 'Il link appartiene a un cliente registrato. Apri la sua scheda.';
  end if;
  if p_html is null or octet_length(p_html) not between 1 and 15000000 then
    raise exception 'Pagina non valida.';
  end if;
  select m.html into v_previous from public.manual_logo_pages m
    where m.slug=v_slug for update;
  if v_previous is distinct from p_expected_html then
    raise exception 'La pagina è stata modificata in un’altra sessione. Riapri Modifica potenziale.';
  end if;
  perform set_config('tapreputa.edit_potential_id',v_potential.id::text,true);
  insert into public.manual_logo_pages(slug,html,created_by)
    values(v_slug,p_html,auth.uid())
    on conflict(slug) do update set html=excluded.html;
  perform set_config('tapreputa.edit_potential_id','',true);
  update public.potenziali_clienti p set logo_data=p_logo_data,
    updated_by=auth.uid(),updated_at=now() where p.id=v_potential.id;
  link_nfc:=v_potential.link_nfc;
  return next;
end
$function$;
revoke all on function public.save_potential_page_composition(uuid,text,text,text) from public,anon;
grant execute on function public.save_potential_page_composition(uuid,text,text,text) to authenticated;

-- Preserve the existing client exception, adding an owned, unconverted prospect.
create or replace function public.guard_manual_logo_page()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op='INSERT' and not exists (select 1 from public.manual_logo_pages m where m.slug=new.slug) and (
    exists (select 1 from public.clienti c where substring(c.link_nfc from '[?&]c=([^&]+)')=new.slug)
    or exists (select 1 from public.potenziali_clienti p where substring(p.link_nfc from '[?&]c=([^&]+)')=new.slug)
  ) then
    if not (new.created_by=auth.uid() and (
      exists (select 1 from public.clienti c
        where c.id::text=current_setting('tapreputa.edit_client_id',true)
          and c.created_by=auth.uid()
          and substring(c.link_nfc from '[?&]c=([^&]+)')=new.slug)
      or (not exists (select 1 from public.clienti c
          where substring(c.link_nfc from '[?&]c=([^&]+)')=new.slug)
        and exists (select 1 from public.potenziali_clienti p
          where p.id::text=current_setting('tapreputa.edit_potential_id',true)
            and p.created_by=auth.uid() and p.stato='potenziale'
            and substring(p.link_nfc from '[?&]c=([^&]+)')=new.slug))
    )) then
      raise exception 'Attività già esistente: la sua pagina è protetta. Usa la scheda esistente.';
    end if;
  end if;
  return new;
end
$function$;
