begin;
select set_config('request.jwt.claims',(select json_build_object('sub',c.created_by::text,'email',u.email,'role','authenticated')::text from public.clienti c join auth.users u on u.id=c.created_by where exists(select 1 from public.manual_logo_pages m where m.slug=substring(c.link_nfc from '[?&]c=([^&]+)')) limit 1),true);
set local role authenticated;
do $$
declare c public.clienti%rowtype; m text; result text; before_count bigint; before_values text; rejected boolean; tested integer:=0;
begin
 select count(*) into before_count from public.clienti;
 for c in select * from public.clienti where created_by=auth.uid() and categoria_codice<>'standard' and substring(link_nfc from '[?&]c=([^&]+)') ~ '^[a-z0-9-]{1,80}$' order by client_no loop
   select html into m from public.manual_logo_pages where slug=substring(c.link_nfc from '[?&]c=([^&]+)');
   before_values:=concat_ws('|',c.link_nfc,c.targhe,c.carte,c.adesivi,c.spesa,c.stato,c.created_at);
   select s.link_nfc into result from public.save_client_page_composition(c.id,coalesce(m,'<!doctype html><html><body>rollback test</body></html>'),c.logo_data,m) s;
   if result<>c.link_nfc or (select concat_ws('|',x.link_nfc,x.targhe,x.carte,x.adesivi,x.spesa,x.stato,x.created_at) from public.clienti x where x.id=c.id)<>before_values then raise exception 'Identity or sales changed'; end if;
   tested:=tested+1;
   rejected:=false;
   begin perform public.save_client_page_composition(c.id,'stale write',c.logo_data,'stale expected content');exception when others then rejected:=true;end;
   if not rejected then raise exception 'Stale update accepted';end if;
 end loop;
 if tested<2 then raise exception 'Insufficient test clients';end if;
 if (select count(*) from public.clienti)<>before_count then raise exception 'Client count changed';end if;
 rejected:=false;
 begin perform public.save_client_page_composition('00000000-0000-0000-0000-000000000000','unauthorized');exception when others then rejected:=true;end;
 if not rejected then raise exception 'Missing client accepted';end if;
end $$;
reset role;
rollback;
select 'PASS: manual and legacy edits; unchanged identity, sales and client count; stale and missing-client rejection; all data rolled back' as result;
