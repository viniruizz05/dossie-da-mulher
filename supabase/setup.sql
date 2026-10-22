begin;
revoke create on schema public from public,anon,authenticated;
create schema if not exists dossie_private;
revoke all on schema dossie_private from public, anon, authenticated;
grant usage on schema dossie_private to authenticated;

create table if not exists dossie_private.editors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
alter table dossie_private.editors enable row level security;
revoke all on dossie_private.editors from public, anon, authenticated;

create or replace function dossie_private.is_editor() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
    and exists(select 1 from dossie_private.editors e where e.user_id = auth.uid() and e.enabled)
    and exists(select 1 from auth.sessions s where s.user_id = auth.uid() and s.id::text = (auth.jwt()->>'session_id'));
$$;
revoke all on function dossie_private.is_editor() from public, anon;
grant execute on function dossie_private.is_editor() to authenticated;

create or replace function public.dossie_editor_access() returns boolean
language sql stable security invoker set search_path = '' as $$ select dossie_private.is_editor(); $$;
revoke all on function public.dossie_editor_access() from public, anon;
grant execute on function public.dossie_editor_access() to authenticated;

create or replace function dossie_private.valid_indicator(doc jsonb, published boolean) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare point jsonb; field text; cap integer; keys text[] := array[]::text[]; groups text[] := array[]::text[]; key text; period_size integer := null;
begin
  if jsonb_typeof(doc) is distinct from 'object' then return false; end if;
  if (select count(*) from jsonb_object_keys(doc))<>9 then return false; end if;
  foreach field in array array['title','unit','description','source','sourceUrl','methodology','topic','chartType'] loop
    if jsonb_typeof(doc->field) is distinct from 'string' then return false; end if;
    cap := case field when 'title' then 120 when 'unit' then 40 when 'description' then 600 when 'source' then 200 when 'sourceUrl' then 500 when 'methodology' then 1200 else 40 end;
    if length(doc->>field)>cap then return false; end if;
  end loop;
  if length(btrim(doc->>'title'))=0 or length(btrim(doc->>'unit'))=0 then return false; end if;
  if doc->>'topic' not in ('violencia','saude','educacao','territorio','participacao','politicas') or doc->>'chartType' not in ('line','bar') then return false; end if;
  if (doc->>'sourceUrl')<>'' and ((doc->>'sourceUrl') !~ '^https?://[^[:space:]/]+([/?#]|$)' or (doc->>'sourceUrl') ~ '^https?://[^/]*@') then return false; end if;
  if jsonb_typeof(doc->'points') is distinct from 'array' then return false; end if;
  if jsonb_array_length(doc->'points')>500 or (published and (jsonb_array_length(doc->'points')=0 or length(btrim(doc->>'source'))=0)) then return false; end if;
  for point in select value from jsonb_array_elements(doc->'points') loop
    if jsonb_typeof(point) is distinct from 'object' then return false; end if;
    if (select count(*) from jsonb_object_keys(point))<>4 then return false; end if;
    if jsonb_typeof(point->'period') is distinct from 'string' or (point->>'period') !~ '^(19|20|21)[0-9]{2}(-(0[1-9]|1[0-2]))?$' then return false; end if;
    if period_size is not null and period_size <> length(point->>'period') then return false; end if;
    period_size := length(point->>'period');
    if jsonb_typeof(point->'series') is distinct from 'string' or length(btrim(point->>'series')) not between 1 and 60 then return false; end if;
    if jsonb_typeof(point->'region') is distinct from 'string' or length(btrim(point->>'region')) not between 1 and 80 then return false; end if;
    if jsonb_typeof(point->'value') is distinct from 'number' then return false; end if;
    if (point->>'value')::numeric<0 or (point->>'value')::numeric>1000000000000 then return false; end if;
    if doc->>'unit'='%' and (point->>'value')::numeric>100 then return false; end if;
    key := jsonb_build_array(point->>'period',point->>'series',point->>'region')::text;
    if key=any(keys) then return false; end if;
    keys:=array_append(keys,key);
    if not ((point->>'series')=any(groups)) then groups:=array_append(groups,point->>'series'); end if;
  end loop;
  return coalesce(array_length(groups,1),0)<=6;
exception when others then return false;
end;
$$;
revoke all on function dossie_private.valid_indicator(jsonb,boolean) from public, anon;
grant execute on function dossie_private.valid_indicator(jsonb,boolean) to authenticated;

create table if not exists public.dossie_drafts (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null check (dossie_private.valid_indicator(data,false)),
  revision integer not null default 1 check (revision>0),
  updated_at timestamptz not null default now()
);
create table if not exists public.dossie_public_indicators (
  id uuid primary key references public.dossie_drafts(id) on delete cascade,
  data jsonb not null check (dossie_private.valid_indicator(data,true)),
  published_at timestamptz not null default now()
);
create table if not exists dossie_private.audit (
  id bigint generated always as identity primary key,
  actor_id uuid,
  email text not null,
  action text not null,
  indicator_id uuid not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists dossie_public_date_idx on public.dossie_public_indicators(published_at desc);
create index if not exists dossie_draft_date_idx on public.dossie_drafts(updated_at desc);
create index if not exists dossie_audit_date_idx on dossie_private.audit(created_at desc);
alter table public.dossie_drafts enable row level security;
alter table public.dossie_public_indicators enable row level security;
alter table dossie_private.audit enable row level security;
revoke all on public.dossie_drafts, public.dossie_public_indicators, dossie_private.audit from public,anon,authenticated;
grant select,insert,update,delete on public.dossie_drafts to authenticated;
grant select on public.dossie_public_indicators to anon,authenticated;
grant insert,update,delete on public.dossie_public_indicators to authenticated;
grant select on dossie_private.audit to authenticated;
drop policy if exists editor_drafts on public.dossie_drafts;
create policy editor_drafts on public.dossie_drafts for all to authenticated using ((select dossie_private.is_editor())) with check ((select dossie_private.is_editor()));
drop policy if exists published_read on public.dossie_public_indicators;
create policy published_read on public.dossie_public_indicators for select to anon,authenticated using (true);
drop policy if exists editor_publish_insert on public.dossie_public_indicators;
create policy editor_publish_insert on public.dossie_public_indicators for insert to authenticated with check ((select dossie_private.is_editor()));
drop policy if exists editor_publish_update on public.dossie_public_indicators;
create policy editor_publish_update on public.dossie_public_indicators for update to authenticated using ((select dossie_private.is_editor())) with check ((select dossie_private.is_editor()));
drop policy if exists editor_publish_delete on public.dossie_public_indicators;
create policy editor_publish_delete on public.dossie_public_indicators for delete to authenticated using ((select dossie_private.is_editor()));
drop policy if exists editor_audit on dossie_private.audit;
create policy editor_audit on dossie_private.audit for select to authenticated using ((select dossie_private.is_editor()));

create or replace function dossie_private.record_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare item jsonb; item_id uuid; action_name text;
begin
  if auth.uid() is null or not dossie_private.is_editor() then raise exception 'DOSSIE_FORBIDDEN' using errcode='42501'; end if;
  if tg_op='DELETE' then item:=old.data; item_id:=old.id; else item:=new.data; item_id:=new.id; end if;
  action_name:=case when tg_table_name='dossie_public_indicators' then case when tg_op='DELETE' then 'unpublish' else 'publish' end else case tg_op when 'DELETE' then 'delete' when 'INSERT' then 'create' else 'edit' end end;
  insert into dossie_private.audit(actor_id,email,action,indicator_id,snapshot) values(auth.uid(),coalesce(auth.jwt()->>'email','Equipe'),action_name,item_id,item);
  return null;
end;
$$;
revoke all on function dossie_private.record_change() from public,anon,authenticated;
drop trigger if exists audit_drafts on public.dossie_drafts;
create trigger audit_drafts after insert or update or delete on public.dossie_drafts for each row execute function dossie_private.record_change();
drop trigger if exists audit_publication on public.dossie_public_indicators;
create trigger audit_publication after insert or update or delete on public.dossie_public_indicators for each row execute function dossie_private.record_change();

create or replace function public.dossie_list_public() returns jsonb
language sql stable security invoker set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'data',data,'published_at',published_at) order by published_at desc),'[]'::jsonb) from public.dossie_public_indicators;
$$;
revoke all on function public.dossie_list_public() from public;
grant execute on function public.dossie_list_public() to anon,authenticated;

create or replace function public.dossie_list_admin() returns jsonb
language plpgsql stable security invoker set search_path='' as $$
begin
  if not dossie_private.is_editor() then raise exception 'DOSSIE_FORBIDDEN' using errcode='42501'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'data',d.data,'revision',d.revision,'updated_at',d.updated_at,'published_at',p.published_at,'status',case when p.id is null then 'draft' when p.data=d.data then 'published' else 'changed' end) order by d.updated_at desc),'[]'::jsonb) from public.dossie_drafts d left join public.dossie_public_indicators p using(id));
end;
$$;
revoke all on function public.dossie_list_admin() from public,anon;
grant execute on function public.dossie_list_admin() to authenticated;

create or replace function public.dossie_list_audit() returns jsonb
language plpgsql stable security invoker set search_path='' as $$
begin
  if not dossie_private.is_editor() then raise exception 'DOSSIE_FORBIDDEN' using errcode='42501'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(a)),'[]'::jsonb) from (select action,email,indicator_id,created_at from dossie_private.audit order by created_at desc,id desc limit 30) a);
end;
$$;
revoke all on function public.dossie_list_audit() from public,anon;
grant execute on function public.dossie_list_audit() to authenticated;

create or replace function public.dossie_mutate(p_id uuid,p_revision integer,p_action text,p_data jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare current_row public.dossie_drafts; target_id uuid; result jsonb;
begin
  if not dossie_private.is_editor() then raise exception 'DOSSIE_FORBIDDEN' using errcode='42501'; end if;
  if p_action is null or p_action not in ('save','publish','unpublish','delete') then raise exception 'DOSSIE_INVALID_DATA' using errcode='22023'; end if;
  if p_action in ('save','publish') and not dossie_private.valid_indicator(p_data,p_action='publish') then raise exception 'DOSSIE_INVALID_DATA' using errcode='22023'; end if;
  if p_id is null then
    if p_action not in ('save','publish') then raise exception 'DOSSIE_INVALID_DATA' using errcode='22023'; end if;
    insert into public.dossie_drafts(data) values(p_data) returning id into target_id;
  else
    select * into current_row from public.dossie_drafts where id=p_id for update;
    if not found then raise exception 'DOSSIE_NOT_FOUND' using errcode='P0002'; end if;
    if p_revision is distinct from current_row.revision then raise exception 'DOSSIE_CONFLICT' using errcode='40001'; end if;
    target_id:=p_id;
    if p_action='delete' then delete from public.dossie_drafts where id=target_id; return '{}'::jsonb; end if;
    update public.dossie_drafts set data=case when p_action in ('save','publish') then p_data else data end,revision=revision+1,updated_at=clock_timestamp() where id=target_id;
  end if;
  if p_action='publish' then
    insert into public.dossie_public_indicators(id,data) values(target_id,p_data) on conflict(id) do update set data=excluded.data,published_at=clock_timestamp();
  elsif p_action='unpublish' then delete from public.dossie_public_indicators where id=target_id;
  end if;
  select jsonb_build_object('id',d.id,'data',d.data,'revision',d.revision,'updated_at',d.updated_at,'published_at',p.published_at,'status',case when p.id is null then 'draft' when p.data=d.data then 'published' else 'changed' end) into result from public.dossie_drafts d left join public.dossie_public_indicators p using(id) where d.id=target_id;
  return result;
end;
$$;
revoke all on function public.dossie_mutate(uuid,integer,text,jsonb) from public,anon;
grant execute on function public.dossie_mutate(uuid,integer,text,jsonb) to authenticated;
-- The dashboard may create this event-trigger helper when automatic RLS is enabled.
-- Event triggers do not require API roles to execute the helper directly.
do $$ begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
commit;
