-- Step 3C-1: preparation only. Apply to a disposable local Supabase database first.
-- No Auth triggers, learner-data backfill, grading RPCs, content publication, or app wiring.
-- CREATE TABLE deliberately fails on schema drift; migration history prevents reapplication.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Small shared identity registries supply real FKs without importing demo answers/content.
-- Slugs match src/data/mock IDs. UUIDs below are permanent, including retired identities.
-- Step 4 adds reviewed content/publication fields; these rows are NOT published lessons/questions.
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 1 and 100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete restrict,
  slug text not null unique check (char_length(slug) between 1 and 160 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lessons_topic_idx on public.lessons(topic_id);

create table public.lesson_versions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete restrict,
  version integer not null check (version > 0),
  created_at timestamptz not null default now(),
  unique (lesson_id, version),
  unique (lesson_id, id)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete restrict,
  slug text not null unique check (char_length(slug) between 1 and 160 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index questions_topic_idx on public.questions(topic_id);

create table public.question_versions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete restrict,
  version integer not null check (version > 0),
  created_at timestamptz not null default now(),
  unique (question_id, version),
  unique (question_id, id)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(btrim(display_name)) between 1 and 80),
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 100),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete restrict,
  lesson_version_id uuid not null,
  resume_section integer not null default 0 check (resume_section >= 0),
  status text not null default 'started' check (status in ('started', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id),
  foreign key (lesson_id, lesson_version_id) references public.lesson_versions(lesson_id, id) on delete restrict,
  check ((status = 'completed') = (completed_at is not null))
);
create index lesson_progress_history_idx on public.lesson_progress(user_id, updated_at desc);
create index lesson_progress_version_idx on public.lesson_progress(lesson_id, lesson_version_id);

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('lesson', 'practice')),
  topic_id uuid references public.topics(id) on delete restrict,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  active_seconds integer not null default 0 check (active_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  check (ended_at is null or ended_at >= started_at)
);
create index study_sessions_history_idx on public.study_sessions(user_id, started_at desc, id);
create index study_sessions_topic_idx on public.study_sessions(topic_id);

create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  question_version_id uuid not null,
  study_session_id uuid,
  assignment_key uuid not null,
  submission_key uuid,
  submission_hash text check (submission_hash ~ '^[0-9a-f]{64}$'),
  response jsonb check (jsonb_typeof(response) = 'object' and octet_length(response::text) <= 32768),
  state text not null default 'assigned' check (state in ('assigned', 'submitted', 'grading', 'graded', 'failed', 'abandoned')),
  score numeric(6,5) check (score between 0 and 1),
  grading_method text check (grading_method = 'answer_key'),
  grader_version text check (char_length(btrim(grader_version)) between 1 and 100),
  feedback jsonb check (jsonb_typeof(feedback) = 'object' and octet_length(feedback::text) <= 32768),
  hint_count integer not null default 0 check (hint_count >= 0),
  solution_viewed_at timestamptz,
  tutor_assisted_at timestamptz,
  evidence_eligible boolean not null default false,
  evidence_day date,
  submitted_at timestamptz,
  graded_at timestamptz,
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  unique (user_id, assignment_key),
  foreign key (question_id, question_version_id) references public.question_versions(question_id, id) on delete restrict,
  -- An attempt cannot attach itself to another user's session, even in a trusted write.
  foreign key (user_id, study_session_id) references public.study_sessions(user_id, id) on delete restrict,
  check ((submission_key is null) = (submission_hash is null)),
  check (state not in ('submitted', 'grading', 'graded') or
    (submission_key is not null and submission_hash is not null and response is not null and submitted_at is not null)),
  check ((state = 'graded') = (graded_at is not null)),
  check (state <> 'graded' or (score is not null and grading_method is not null and grader_version is not null)),
  check (state = 'graded' or (score is null and grading_method is null and grader_version is null and feedback is null)),
  check (graded_at is null or (submitted_at is not null and graded_at >= submitted_at)),
  check (submitted_at is null or submitted_at >= created_at),
  check (evidence_day is null or (submitted_at is not null and evidence_day = (submitted_at at time zone 'UTC')::date)),
  check (not evidence_eligible or (state = 'graded' and grading_method = 'answer_key' and
    hint_count = 0 and evidence_day is not null and
    (solution_viewed_at is null or solution_viewed_at >= submitted_at) and
    (tutor_assisted_at is null or tutor_assisted_at >= submitted_at)))
);
create unique index question_attempts_submission_key_idx on public.question_attempts(user_id, submission_key) where submission_key is not null;
create unique index question_attempts_daily_evidence_idx on public.question_attempts(user_id, question_id, evidence_day) where evidence_eligible;
create index question_attempts_history_idx on public.question_attempts(user_id, created_at desc, id);
create index question_attempts_state_idx on public.question_attempts(user_id, state);
create index question_attempts_version_idx on public.question_attempts(question_id, question_version_id);
create index question_attempts_session_idx on public.question_attempts(user_id, study_session_id);
create index question_attempts_evidence_idx on public.question_attempts(user_id, graded_at desc) where evidence_eligible;

create table public.user_topic_mastery (
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete restrict,
  algorithm_version text not null check (char_length(btrim(algorithm_version)) between 1 and 100),
  alpha numeric(12,5) not null check (alpha between 1 and 61),
  beta numeric(12,5) not null check (beta between 1 and 61),
  estimate numeric(6,5) not null check (estimate between 0 and 1),
  eligible_attempt_count integer not null check (eligible_attempt_count between 0 and 30),
  distinct_question_count integer not null check (distinct_question_count between 0 and eligible_attempt_count),
  distinct_evidence_days integer not null check (distinct_evidence_days between 0 and eligible_attempt_count),
  last_evidence_at timestamptz,
  created_at timestamptz not null default now(),
  computed_at timestamptz not null default now(),
  primary key (user_id, topic_id),
  check (abs(estimate - alpha / (alpha + beta)) <= 0.00001),
  check ((eligible_attempt_count = 0 and alpha = 1 and beta = 1 and last_evidence_at is null) or
    (eligible_attempt_count > 0 and distinct_question_count > 0 and distinct_evidence_days > 0 and last_evidence_at is not null))
);
create index user_topic_mastery_topic_idx on public.user_topic_mastery(topic_id, user_id);

-- No SECURITY DEFINER helpers or caller-supplied actor IDs. Triggers only validate/maintain NEW.
create function private.learning_touch_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;
revoke all on function private.learning_touch_updated_at() from public, anon, authenticated, service_role;

create function private.learning_validate_profile() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Unknown timezone' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.learning_validate_profile() from public, anon, authenticated, service_role;

create trigger profiles_validate before insert or update on public.profiles for each row execute function private.learning_validate_profile();
create trigger profiles_updated_at before update on public.profiles for each row execute function private.learning_touch_updated_at();
create trigger lesson_progress_updated_at before update on public.lesson_progress for each row execute function private.learning_touch_updated_at();
create trigger study_sessions_updated_at before update on public.study_sessions for each row execute function private.learning_touch_updated_at();
create trigger question_attempts_updated_at before update on public.question_attempts for each row execute function private.learning_touch_updated_at();
create trigger topics_updated_at before update on public.topics for each row execute function private.learning_touch_updated_at();
create trigger lessons_updated_at before update on public.lessons for each row execute function private.learning_touch_updated_at();
create trigger questions_updated_at before update on public.questions for each row execute function private.learning_touch_updated_at();

alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.study_sessions enable row level security;
alter table public.question_attempts enable row level security;
alter table public.user_topic_mastery enable row level security;
alter table public.topics enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_versions enable row level security;
alter table public.questions enable row level security;
alter table public.question_versions enable row level security;

-- Remove Supabase default table grants before allowing only the documented operations.
revoke all on table public.profiles, public.lesson_progress, public.study_sessions,
  public.question_attempts, public.user_topic_mastery, public.topics, public.lessons,
  public.lesson_versions, public.questions, public.question_versions
  from public, anon, authenticated, service_role;

grant select on table public.profiles, public.lesson_progress, public.study_sessions, public.user_topic_mastery to authenticated;
grant insert (id, display_name, timezone) on table public.profiles to authenticated;
grant update (display_name, timezone) on table public.profiles to authenticated;

create policy profiles_owner_read on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_owner_insert on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy profiles_owner_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy lesson_progress_owner_read on public.lesson_progress for select to authenticated using (user_id = (select auth.uid()));
create policy study_sessions_owner_read on public.study_sessions for select to authenticated using (user_id = (select auth.uid()));
create policy user_topic_mastery_owner_read on public.user_topic_mastery for select to authenticated using (user_id = (select auth.uid()));
-- Defense in depth only: raw attempt SELECT is still revoked; future safe DTOs gate feedback.
create policy question_attempts_owner_read on public.question_attempts for select to authenticated using (user_id = (select auth.uid()));

-- Future narrow server adapters must verify their actor before using this RLS-bypassing role.
grant select, insert, update, delete on table public.profiles, public.lesson_progress,
  public.study_sessions, public.question_attempts, public.user_topic_mastery to service_role;
-- Catalog identities/versions are insert-only through the API. No learner reads/publication yet.
grant select, insert on table public.topics, public.lessons, public.lesson_versions,
  public.questions, public.question_versions to service_role;

-- Fixed UUIDv5 seeds: DNS namespace, names interview-compass/<kind>/<app-id>.

-- These literals are the permanent mapping. Never rename/reuse a slug or recalculate identities.

insert into public.topics (id, slug) values
  ('d1fbfb4b-c7ba-5fa1-87b3-9ace0a559467', 'python'),
  ('c623902c-3c20-53b3-bd2f-c1f04a0d44a6', 'sql'),
  ('f36add82-53bd-519f-a654-ec140317b02e', 'javascript'),
  ('ddab91b1-a103-55c9-a441-708103d84bee', 'data-structures'),
  ('7442292d-fd81-5891-8d4c-3d8f6b7f6c66', 'algorithms'),
  ('31b0a10f-1cf2-5106-a7f8-2c92fdaa3bb9', 'cs-fundamentals'),
  ('7e88c5ac-46bc-5e49-b9c5-aeccdefde436', 'statistics'),
  ('931a4251-18d6-5cc1-9af7-3ba7a77d9449', 'problem-solving')
on conflict (id) do nothing;

insert into public.lessons (id, topic_id, slug) values
  ('b967d196-6dea-55c9-a35c-cbbd82b654b9', 'd1fbfb4b-c7ba-5fa1-87b3-9ace0a559467', 'python-variables'),
  ('635113f0-0b64-50ae-906f-bab6677b34d1', 'd1fbfb4b-c7ba-5fa1-87b3-9ace0a559467', 'python-loops'),
  ('ccfb4c8c-6330-52ad-b600-b80b8fa6e220', 'd1fbfb4b-c7ba-5fa1-87b3-9ace0a559467', 'python-lists'),
  ('7ad7e492-c408-5026-9588-15a326367e68', 'c623902c-3c20-53b3-bd2f-c1f04a0d44a6', 'sql-select'),
  ('6551983a-00b9-5c5e-a287-bd1091fff7cf', 'c623902c-3c20-53b3-bd2f-c1f04a0d44a6', 'sql-joins'),
  ('bfe28b55-f20a-54af-89de-936511be4094', '7442292d-fd81-5891-8d4c-3d8f6b7f6c66', 'big-o')
on conflict (id) do nothing;

insert into public.lesson_versions (id, lesson_id, version) values
  ('3de4e9ff-3252-56ac-89ee-4a5be72ebfab', 'b967d196-6dea-55c9-a35c-cbbd82b654b9', 1),
  ('be82acca-d29b-5ccb-95bf-88114d5974cc', '635113f0-0b64-50ae-906f-bab6677b34d1', 1),
  ('d4f6d9fc-7ace-5ee2-b130-c4b093bd95e3', 'ccfb4c8c-6330-52ad-b600-b80b8fa6e220', 1),
  ('12a5ec15-a230-54ac-ab51-e19938e27a13', '7ad7e492-c408-5026-9588-15a326367e68', 1),
  ('922a3c97-797b-546d-803b-a15d106f3431', '6551983a-00b9-5c5e-a287-bd1091fff7cf', 1),
  ('0c443e3e-4780-5b1c-8d35-87b4911af165', 'bfe28b55-f20a-54af-89de-936511be4094', 1)
on conflict (id) do nothing;

insert into public.questions (id, topic_id, slug) values
  ('d6946209-76b6-59b4-beff-8c0a6251fda9', 'd1fbfb4b-c7ba-5fa1-87b3-9ace0a559467', 'python-types'),
  ('0a4a3147-72de-53f1-8bd2-0ec94f8ee162', 'd1fbfb4b-c7ba-5fa1-87b3-9ace0a559467', 'python-range'),
  ('4999a6e5-8682-5443-8bd3-c4d7b1f63fe2', 'd1fbfb4b-c7ba-5fa1-87b3-9ace0a559467', 'python-list'),
  ('1db140b1-af36-5a65-b91f-d55aa3987862', 'c623902c-3c20-53b3-bd2f-c1f04a0d44a6', 'sql-filter'),
  ('8b634a5e-82cc-5c33-94c1-738ab033d83a', 'c623902c-3c20-53b3-bd2f-c1f04a0d44a6', 'sql-left-join'),
  ('831cc487-ab66-5d72-810b-b2ca4a116884', '7442292d-fd81-5891-8d4c-3d8f6b7f6c66', 'complexity-scan'),
  ('f7122a97-6d90-50ae-89d7-e2ba6da4cf80', 'f36add82-53bd-519f-a654-ec140317b02e', 'javascript-const'),
  ('ef4b2584-b5b2-5366-ae71-8a12efeb02da', 'ddab91b1-a103-55c9-a441-708103d84bee', 'stack-concept'),
  ('04f4472c-3ae5-5837-82ef-9410f68dfe1c', '31b0a10f-1cf2-5106-a7f8-2c92fdaa3bb9', 'relational-key'),
  ('9ca9b88b-c156-593c-ba3c-119d3a3d19e2', '7e88c5ac-46bc-5e49-b9c5-aeccdefde436', 'mean-median'),
  ('10cdea56-14a5-582c-b64a-d019dc2553de', '931a4251-18d6-5cc1-9af7-3ba7a77d9449', 'clarify-problem'),
  ('6d1f6601-43e2-5de3-a44b-9784caacdb76', 'd1fbfb4b-c7ba-5fa1-87b3-9ace0a559467', 'python-sum-exercise'),
  ('39a9ab06-f834-5df9-af43-f5244e144225', 'c623902c-3c20-53b3-bd2f-c1f04a0d44a6', 'sql-query-exercise')
on conflict (id) do nothing;

insert into public.question_versions (id, question_id, version) values
  ('bad65157-3d32-562e-9981-810904d238f7', 'd6946209-76b6-59b4-beff-8c0a6251fda9', 1),
  ('f9013ac3-c896-5e6a-a6cc-5564cbba48ef', '0a4a3147-72de-53f1-8bd2-0ec94f8ee162', 1),
  ('7a364a6b-aecf-5d08-9a38-c70de75affe4', '4999a6e5-8682-5443-8bd3-c4d7b1f63fe2', 1),
  ('3871a984-58e9-57d3-8515-d41278534399', '1db140b1-af36-5a65-b91f-d55aa3987862', 1),
  ('d122231a-e136-53d3-a89c-0a5f17dd417d', '8b634a5e-82cc-5c33-94c1-738ab033d83a', 1),
  ('7f3397d2-ee38-54e3-83cc-42a270ee3b88', '831cc487-ab66-5d72-810b-b2ca4a116884', 1),
  ('5ec94396-2ccc-5461-8667-9a8ee51946d7', 'f7122a97-6d90-50ae-89d7-e2ba6da4cf80', 1),
  ('6a0cdd4d-7624-549f-9c4b-ca31c719d374', 'ef4b2584-b5b2-5366-ae71-8a12efeb02da', 1),
  ('5ce27fce-ba52-513a-b016-1b903506a5fb', '04f4472c-3ae5-5837-82ef-9410f68dfe1c', 1),
  ('05890152-e50a-5050-9658-79f814dba1c9', '9ca9b88b-c156-593c-ba3c-119d3a3d19e2', 1),
  ('76e225d0-1bdf-5e93-986b-308ede956c1e', '10cdea56-14a5-582c-b64a-d019dc2553de', 1),
  ('cc76ba62-2dd5-505f-9dc7-13bb8e7f5da0', '6d1f6601-43e2-5de3-a44b-9784caacdb76', 1),
  ('709abb16-66b5-5985-b0c2-0b3dc450d603', '39a9ab06-f834-5df9-af43-f5244e144225', 1)
on conflict (id) do nothing;

commit;
