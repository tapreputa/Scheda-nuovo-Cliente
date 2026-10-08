-- Refresh only the potential page version; preserve client tracking, links and privileges.
do $update$
declare
  original_definition text;
  updated_definition text;
begin
  original_definition := pg_get_functiondef('public.register_nfc_tap(text)'::regprocedure);
  if position('&v=20261008-logo-surface1' in original_definition) > 0 then
    return;
  end if;
  if position('&v=20260929-clean' in original_definition) = 0 then
    raise exception 'Unexpected potential page version; no change applied';
  end if;
  updated_definition := replace(original_definition, '&v=20260929-clean', '&v=20261008-logo-surface1');
  execute updated_definition;
end;
$update$;
