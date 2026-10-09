-- Client page edits retain the NFC URL and use the caller's existing RLS rights.
create or replace function public.guard_manual_logo_page() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op='INSERT' and not exists (select 1 from public.manual_logo_pages m where m.slug=new.slug) and (
    exists (select 1 from public.clienti c where substring(c.link_nfc from '[?&]c=([^&]+)')=new.slug)
    or exists (select 1 from public.potenziali_clienti p where substring(p.link_nfc from '[?&]c=([^&]+)')=new.slug)
  ) then
    if not (new.created_by=auth.uid() and exists (
      select 1 from public.clienti c
      where c.id::text=current_setting('tapreputa.edit_client_id',true)
        and c.created_by=auth.uid()
        and substring(c.link_nfc from '[?&]c=([^&]+)')=new.slug
    )) then
      raise exception 'Attività già esistente: la sua pagina è protetta. Usa la scheda esistente.';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.guard_manual_logo_page() from public,anon,authenticated;

create function public.save_client_page_composition(
  p_client_id uuid,p_html text,p_logo_data text default null,p_expected_html text default null
) returns table(link_nfc text)
language plpgsql security invoker set search_path='' as $$
declare
  v_client public.clienti%rowtype;
  v_slug text;
  v_previous text;
begin
  if auth.uid() is null or not public.is_tapnfc_operator() then
    raise exception 'Operatore non autorizzato.';
  end if;
  select c.* into v_client from public.clienti c where c.id=p_client_id for update;
  if v_client.id is null or v_client.created_by is distinct from auth.uid() then
    raise exception 'Cliente non disponibile o non modificabile.';
  end if;
  if v_client.categoria_codice='standard' then raise exception 'Questo cliente usa il link diretto a Google.'; end if;
  v_slug:=substring(v_client.link_nfc from '[?&]c=([^&]+)');
  if v_slug is null or v_slug !~ '^[a-z0-9-]{1,80}$' then raise exception 'Link cliente non valido.'; end if;
  if p_html is null or octet_length(p_html) not between 1 and 15000000 then raise exception 'Pagina non valida.'; end if;
  select m.html into v_previous from public.manual_logo_pages m where m.slug=v_slug for update;
  if v_previous is distinct from p_expected_html then
    raise exception 'La pagina è stata modificata in un’altra sessione. Riapri Modifica cliente.';
  end if;
  perform set_config('tapreputa.edit_client_id',v_client.id::text,true);
  insert into public.manual_logo_pages(slug,html,created_by) values(v_slug,p_html,auth.uid())
    on conflict(slug) do update set html=excluded.html;
  perform set_config('tapreputa.edit_client_id','',true);
  update public.clienti c set logo_data=p_logo_data,updated_by=auth.uid() where c.id=v_client.id;
  link_nfc:=v_client.link_nfc;
  return next;
end $$;
revoke all on function public.save_client_page_composition(uuid,text,text,text) from public,anon;
grant execute on function public.save_client_page_composition(uuid,text,text,text) to authenticated;

