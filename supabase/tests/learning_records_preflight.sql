-- Read-only: run in the intended project's SQL Editor BEFORE applying Step 3C-1.
-- This checks compatibility, not project identity; confirm the dashboard project separately.
begin transaction read only;
set local statement_timeout = '5s';

do $$
declare object_name text;
begin
  if to_regclass('auth.users') is null or to_regprocedure('auth.uid()') is null then
    raise exception 'Supabase Auth is required';
  end if;
  foreach object_name in array array['anon', 'authenticated', 'service_role'] loop
    if not exists (select 1 from pg_catalog.pg_roles where rolname = object_name) then
      raise exception 'Required Supabase role missing: %', object_name;
    end if;
  end loop;
  foreach object_name in array array['profiles', 'lesson_progress', 'study_sessions',
    'question_attempts', 'user_topic_mastery', 'topics', 'lessons', 'lesson_versions',
    'questions', 'question_versions'] loop
    if to_regclass('public.' || object_name) is not null or
      to_regtype('public.' || object_name) is not null then
      raise exception 'Existing object public.% requires review; do not overwrite it', object_name;
    end if;
  end loop;
  -- The migration changes private-schema privileges. Never assume an existing one is unused.
  if exists (select 1 from pg_catalog.pg_namespace where nspname = 'private') then
    raise exception 'Existing private schema requires an object/grant review before application';
  end if;
end;
$$;

select 'Preflight passed; this does not apply or authorize the migration' as result;
commit;
