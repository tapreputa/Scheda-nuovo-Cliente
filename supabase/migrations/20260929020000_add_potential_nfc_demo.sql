-- Un token casuale per ogni proposta; nessuna modifica alle schede dei clienti.
alter table public.potenziali_clienti
  add column preview_token uuid not null default gen_random_uuid();
alter table public.potenziali_clienti
  add constraint potenziali_clienti_preview_token_key unique (preview_token);

-- Espone solo i contenuti della pagina demo, mai quantità, importi o identità degli operatori.
-- Il token smette di funzionare se il potenziale è eliminato o convertito.
create function public.get_public_potential_preview(p_token uuid)
returns table (nome text, categoria_codice text, link_recensioni text, logo_data text)
language sql stable security definer
set search_path = ''
as $function$
  select p.nome, p.categoria_codice, p.link_recensioni, p.logo_data
  from public.potenziali_clienti p
  where p.preview_token = p_token and p.stato = 'potenziale'
  limit 1;
$function$;
revoke all on function public.get_public_potential_preview(uuid) from public;
grant execute on function public.get_public_potential_preview(uuid) to anon, authenticated;
