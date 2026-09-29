-- Aggiorna solo la destinazione dei potenziali con una versione della pagina
-- che evita la cache del browser; la card mantiene il medesimo link ufficiale.
create or replace function public.register_nfc_tap(p_link_nfc text)
returns table(client_id uuid, target_url text)
language plpgsql security definer
set search_path = 'public', 'pg_temp'
as $function$
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

    if coalesce(v_client.categoria_codice, '') = 'standard' then
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

  if coalesce(v_potential.categoria_codice, '') = 'standard' then
    target_url := v_potential.link_recensioni;
  else
    target_url := 'https://tapreputa.github.io/Scheda-nuovo-Cliente/demo.html?t='
      || v_potential.preview_token::text || '&v=20260929-clean';
  end if;
  if nullif(target_url, '') is null then
    return;
  end if;

  client_id := null;
  return next;
end;
$function$;
