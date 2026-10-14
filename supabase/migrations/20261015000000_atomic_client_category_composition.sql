-- Staged only: atomic category + HTML composition save.
-- Do not deploy until the editor can build a reviewed replacement snapshot.
create or replace function public.save_client_category_composition(
  p_client_id uuid,
  p_expected_category text,
  p_category text,
  p_category_label text,
  p_html text,
  p_expected_html text
) returns table(link_nfc text)
language plpgsql security invoker set search_path = ''
as $$
declare
  v_client public.clienti%rowtype;
  v_slug text;
  v_old_html text;
begin
  if auth.uid() is null or not public.is_tapnfc_operator() then
    raise exception 'Operatore non autorizzato.';
  end if;
  select * into v_client from public.clienti
    where id = p_client_id for update;
  if v_client.id is null or v_client.created_by is distinct from auth.uid() then
    raise exception 'Cliente non modificabile.';
  end if;
  if v_client.categoria_codice is distinct from p_expected_category then
    raise exception 'La categoria è stata modificata in un’altra sessione.';
  end if;
  if p_category is null or p_category = 'standard'
    or p_category !~ '^[a-z][a-z0-9_]{1,79}$'
    or nullif(btrim(p_category_label),'') is null then
    raise exception 'Categoria non valida o non supportata.';
  end if;
  v_slug := substring(v_client.link_nfc from '[?&]c=([^&]+)');
  if v_slug is null or v_slug !~ '^[a-z0-9-]{1,80}$' then
    raise exception 'Link NFC non valido.';
  end if;
  if p_html is null or octet_length(p_html) not between 100 and 15000000 then
    raise exception 'Composizione non valida.';
  end if;
  select html into v_old_html from public.manual_logo_pages
    where slug = v_slug for update;
  if v_old_html is distinct from p_expected_html then
    raise exception 'La pagina pubblicata è stata modificata in un’altra sessione.';
  end if;
  -- Both writes share this transaction: an error rolls them back together.
  perform set_config('tapreputa.edit_client_id',v_client.id::text,true);
  insert into public.manual_logo_pages(slug,html,created_by)
    values(v_slug,p_html,auth.uid())
    on conflict(slug) do update set html = excluded.html;
  perform set_config('tapreputa.edit_client_id','',true);
  update public.clienti
    set categoria_codice = p_category,
        categoria = p_category_label,
        updated_by = auth.uid()
    where id = v_client.id;
  link_nfc := v_client.link_nfc;
  return next;
end $$;
revoke all on function public.save_client_category_composition(uuid,text,text,text,text,text) from public, anon;
grant execute on function public.save_client_category_composition(uuid,text,text,text,text,text) to authenticated;
