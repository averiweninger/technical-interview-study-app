-- LOCAL/DISPOSABLE SUPABASE ONLY. Plain psql assertions; no pgTAP dependency.
-- Run as the local postgres migration owner with ON_ERROR_STOP=1. All fixtures roll back.
begin;
set local statement_timeout = '15s';

insert into auth.users (id) values
  ('a0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000003');
insert into public.profiles (id, display_name) values
  ('a0000000-0000-4000-8000-000000000001', 'Synthetic A'),
  ('b0000000-0000-4000-8000-000000000002', 'Synthetic B');
insert into public.lesson_progress (user_id, lesson_id, lesson_version_id)
select id, 'b967d196-6dea-55c9-a35c-cbbd82b654b9', '3de4e9ff-3252-56ac-89ee-4a5be72ebfab' from public.profiles
where id in ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002');
insert into public.study_sessions (id, user_id, kind, topic_id) values
  ('a1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'practice', 'd1fbfb4b-c7ba-5fa1-87b3-9ace0a559467'),
  ('b1000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'practice', 'd1fbfb4b-c7ba-5fa1-87b3-9ace0a559467');
insert into public.question_attempts (user_id, question_id, question_version_id, study_session_id, assignment_key)
select user_id, 'd6946209-76b6-59b4-beff-8c0a6251fda9', 'bad65157-3d32-562e-9981-810904d238f7', id, gen_random_uuid()
from public.study_sessions where id in ('a1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000002');
insert into public.user_topic_mastery (user_id, topic_id, algorithm_version, alpha, beta, estimate,
  eligible_attempt_count, distinct_question_count, distinct_evidence_days)
select id, 'd1fbfb4b-c7ba-5fa1-87b3-9ace0a559467', 'test-unassessed', 1, 1, 0.5, 0, 0, 0 from public.profiles
where id in ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
do $$
declare relation_name text; visible_count integer; changed_count integer;
begin
  foreach relation_name in array array['profiles', 'lesson_progress', 'study_sessions', 'user_topic_mastery'] loop
    execute format('select count(*) from public.%I', relation_name) into visible_count;
    if visible_count <> 1 then raise exception 'Owner isolation failed: %', relation_name; end if;
  end loop;
  update public.profiles set display_name = 'Updated A', timezone = 'America/Indiana/Indianapolis'
    where id = 'a0000000-0000-4000-8000-000000000001';
  get diagnostics changed_count = row_count;
  if changed_count <> 1 then raise exception 'Owner profile update failed'; end if;
  update public.profiles set display_name = 'Forbidden' where id = 'b0000000-0000-4000-8000-000000000002';
  get diagnostics changed_count = row_count;
  if changed_count <> 0 then raise exception 'Another profile was updated'; end if;
  begin
    update public.profiles set id = 'c0000000-0000-4000-8000-000000000003'
      where id = 'a0000000-0000-4000-8000-000000000001';
    raise exception 'Ownership transfer allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.profiles(id) values ('c0000000-0000-4000-8000-000000000003');
    raise exception 'Foreign profile insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set onboarding_completed_at = now() where id = 'a0000000-0000-4000-8000-000000000001';
    raise exception 'Trusted profile column writable';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.profiles where id = 'a0000000-0000-4000-8000-000000000001';
    raise exception 'Learner profile deletion allowed';
  exception when insufficient_privilege then null; end;
  foreach relation_name in array array['lesson_progress', 'study_sessions', 'question_attempts', 'user_topic_mastery'] loop
    begin
      execute format('insert into public.%I(user_id) values ($1)', relation_name)
        using 'a0000000-0000-4000-8000-000000000001'::uuid;
      raise exception 'Learner insert allowed: %', relation_name;
    exception when insufficient_privilege then null; end;
    begin
      execute format('update public.%I set user_id = $1 where user_id = $2', relation_name)
        using 'b0000000-0000-4000-8000-000000000002'::uuid, 'a0000000-0000-4000-8000-000000000001'::uuid;
      raise exception 'Learner ownership rewrite allowed: %', relation_name;
    exception when insufficient_privilege then null; end;
    begin
      execute format('delete from public.%I', relation_name);
      raise exception 'Learner delete allowed: %', relation_name;
    exception when insufficient_privilege then null; end;
  end loop;
  begin
    perform 1 from public.question_attempts;
    raise exception 'Raw attempt feedback readable';
  exception when insufficient_privilege then null; end;
  foreach relation_name in array array['topics', 'lessons', 'lesson_versions', 'questions', 'question_versions'] loop
    begin
      execute format('select 1 from public.%I', relation_name);
      raise exception 'Unpublished catalog identity readable: %', relation_name;
    exception when insufficient_privilege then null; end;
  end loop;
end;
$$;

-- A second caller sees only its own records; an Auth user may bootstrap only its own profile.
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from public.profiles) <> 1 or
    (select display_name from public.profiles) <> 'Synthetic B' or
    exists (select 1 from public.lesson_progress where user_id <> auth.uid()) or
    exists (select 1 from public.study_sessions where user_id <> auth.uid()) or
    exists (select 1 from public.user_topic_mastery where user_id <> auth.uid()) then
    raise exception 'Second-user isolation failed';
  end if;
end;
$$;
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
insert into public.profiles(id) values ('c0000000-0000-4000-8000-000000000003');

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
do $$
begin
  if exists (select 1 from public.profiles) or exists (select 1 from public.lesson_progress) or
    exists (select 1 from public.study_sessions) or exists (select 1 from public.user_topic_mastery) then
    raise exception 'Missing identity exposed owned records';
  end if;
end;
$$;
reset role;
set local role anon;
do $$
declare relation_name text;
begin
  foreach relation_name in array array['profiles', 'lesson_progress', 'study_sessions', 'question_attempts', 'user_topic_mastery'] loop
    begin
      execute format('select 1 from public.%I', relation_name);
      raise exception 'Anonymous access allowed: %', relation_name;
    exception when insufficient_privilege then null; end;
  end loop;
end;
$$;
reset role;

-- Privileged fixtures exercise constraints that RLS alone cannot enforce.
do $$
begin
  begin
    insert into public.profiles(id) values ('d0000000-0000-4000-8000-000000000004');
    raise exception 'Profile without Auth identity accepted';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.question_attempts(user_id, question_id, question_version_id, study_session_id, assignment_key)
      values ('a0000000-0000-4000-8000-000000000001', 'd6946209-76b6-59b4-beff-8c0a6251fda9',
        'bad65157-3d32-562e-9981-810904d238f7', 'b1000000-0000-4000-8000-000000000002', gen_random_uuid());
    raise exception 'Cross-owner session accepted';
  exception when foreign_key_violation then null; end;
  begin
    update public.lesson_progress set lesson_version_id = 'be82acca-d29b-5ccb-95bf-88114d5974cc';
    raise exception 'Wrong lesson version accepted';
  exception when foreign_key_violation then null; end;
  begin
    update public.question_attempts set question_version_id = 'f9013ac3-c896-5e6a-a6cc-5564cbba48ef';
    raise exception 'Wrong question version accepted';
  exception when foreign_key_violation then null; end;
  begin
    update public.lesson_progress set status = 'completed', completed_at = null;
    raise exception 'Invalid completion accepted';
  exception when check_violation then null; end;
  begin
    update public.study_sessions set active_seconds = -1;
    raise exception 'Negative engagement accepted';
  exception when check_violation then null; end;
  begin
    update public.profiles set timezone = 'Invalid/Timezone';
    raise exception 'Invalid timezone accepted';
  exception when check_violation then null; end;
  begin
    update public.user_topic_mastery set estimate = 0.9;
    raise exception 'Inconsistent mastery accepted';
  exception when check_violation then null; end;
  begin
    insert into public.question_attempts(user_id, question_id, question_version_id, assignment_key)
      select user_id, question_id, question_version_id, assignment_key from public.question_attempts limit 1;
    raise exception 'Duplicate assignment accepted';
  exception when unique_violation then null; end;
  begin
    update public.question_attempts set state = 'graded', graded_at = now();
    raise exception 'Incomplete grade accepted';
  exception when check_violation then null; end;
end;
$$;

-- Session history is retained while attempts refer to it. Future deletion clears attempts first.
do $$
begin
  begin
    delete from public.study_sessions where id = 'a1000000-0000-4000-8000-000000000001';
    raise exception 'Referenced session deleted';
  exception when foreign_key_violation then null; end;
end;
$$;
delete from public.question_attempts where user_id = 'a0000000-0000-4000-8000-000000000001';
delete from auth.users where id = 'a0000000-0000-4000-8000-000000000001';
do $$
begin
  if exists (select 1 from public.profiles where id = 'a0000000-0000-4000-8000-000000000001') or
    exists (select 1 from public.lesson_progress where user_id = 'a0000000-0000-4000-8000-000000000001') or
    exists (select 1 from public.study_sessions where user_id = 'a0000000-0000-4000-8000-000000000001') or
    exists (select 1 from public.user_topic_mastery where user_id = 'a0000000-0000-4000-8000-000000000001') or
    not exists (select 1 from public.profiles where id = 'b0000000-0000-4000-8000-000000000002') then
    raise exception 'Synthetic deletion cascade/isolation failed';
  end if;
end;
$$;
rollback;
