-- Read-only, metadata only: run AFTER application in the intended project's SQL Editor.
-- No learner/Auth records, JWTs, or credentials are selected. This is not an isolation test.
begin transaction read only;
set local statement_timeout = '5s';

do $$
declare relation_name text; relation_id regclass; attribute record; allowed boolean; expected_policy_count integer;
begin
  foreach relation_name in array array['profiles', 'lesson_progress', 'study_sessions',
    'question_attempts', 'user_topic_mastery', 'topics', 'lessons', 'lesson_versions',
    'questions', 'question_versions'] loop
    relation_id := to_regclass('public.' || relation_name);
    if relation_id is null then raise exception 'Missing table: %', relation_name; end if;
    if not exists (select 1 from pg_catalog.pg_class where oid = relation_id and relrowsecurity and relkind = 'r') then
      raise exception 'RLS missing or unexpected relation type: %', relation_name;
    end if;
    expected_policy_count := case when relation_name = 'profiles' then 3
      when relation_name in ('lesson_progress', 'study_sessions', 'question_attempts', 'user_topic_mastery') then 1 else 0 end;
    if (select count(*) from pg_catalog.pg_policy where polrelid = relation_id) <> expected_policy_count then
      raise exception 'Unexpected policy count: %', relation_name;
    end if;
    if exists (select 1 from pg_catalog.pg_policy where polrelid = relation_id and
      (polroles <> array[(select oid from pg_catalog.pg_roles where rolname = 'authenticated')] or
       polcmd not in ('r', 'a', 'w') or
       (relation_name <> 'profiles' and polcmd <> 'r'))) then
      raise exception 'Unexpected policy roles/commands: %', relation_name;
    end if;
    if has_any_column_privilege('anon', relation_id, 'SELECT,INSERT,UPDATE,REFERENCES') or
      has_table_privilege('anon', relation_id, 'DELETE,TRUNCATE,TRIGGER') then
      raise exception 'Anonymous privileges found: %', relation_name;
    end if;
    if has_table_privilege('authenticated', relation_id, 'DELETE,TRUNCATE,TRIGGER,REFERENCES') then
      raise exception 'Unexpected authenticated table privileges: %', relation_name;
    end if;
    for attribute in select attname from pg_catalog.pg_attribute
      where attrelid = relation_id and attnum > 0 and not attisdropped loop
      allowed := relation_name in ('profiles', 'lesson_progress', 'study_sessions', 'user_topic_mastery');
      if has_column_privilege('authenticated', relation_id, attribute.attname, 'SELECT') <> allowed then
        raise exception 'Unexpected SELECT privilege: %.%', relation_name, attribute.attname;
      end if;
      allowed := relation_name = 'profiles' and attribute.attname in ('id', 'display_name', 'timezone');
      if has_column_privilege('authenticated', relation_id, attribute.attname, 'INSERT') <> allowed then
        raise exception 'Unexpected INSERT privilege: %.%', relation_name, attribute.attname;
      end if;
      allowed := relation_name = 'profiles' and attribute.attname in ('display_name', 'timezone');
      if has_column_privilege('authenticated', relation_id, attribute.attname, 'UPDATE') <> allowed or
        has_column_privilege('authenticated', relation_id, attribute.attname, 'REFERENCES') then
        raise exception 'Unexpected UPDATE/REFERENCES privilege: %.%', relation_name, attribute.attname;
      end if;
    end loop;
  end loop;
end;
$$;

-- Inspect these expressions too: metadata privilege checks do not prove owner isolation.
select tablename, policyname, roles, cmd, qual, with_check
from pg_catalog.pg_policies
where schemaname = 'public' and tablename in ('profiles', 'lesson_progress',
  'study_sessions', 'question_attempts', 'user_topic_mastery', 'topics', 'lessons',
  'lesson_versions', 'questions', 'question_versions')
order by tablename, policyname;

select c.relname as table_name, k.conname, k.convalidated,
  pg_catalog.pg_get_constraintdef(k.oid) as definition
from pg_catalog.pg_constraint k join pg_catalog.pg_class c on c.oid = k.conrelid
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('profiles', 'lesson_progress',
  'study_sessions', 'question_attempts', 'user_topic_mastery', 'topics', 'lessons',
  'lesson_versions', 'questions', 'question_versions')
order by c.relname, k.conname;

select tablename, indexname, indexdef from pg_catalog.pg_indexes
where schemaname = 'public' and tablename in ('profiles', 'lesson_progress',
  'study_sessions', 'question_attempts', 'user_topic_mastery', 'topics', 'lessons',
  'lesson_versions', 'questions', 'question_versions')
order by tablename, indexname;

select 'Table/RLS/grant checks passed; review policies and run isolated behavioral tests separately' as result;
commit;
