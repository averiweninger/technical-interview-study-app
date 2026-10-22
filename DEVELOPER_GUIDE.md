# Developer Guide

### Step 3D stabilization review (2026-10-22)

Scope: partial AUTH-01, ONB-01, LES-01, QUIZ-01, PROG-01, and HIST-01. The working tree was clean at entry. Validated Auth metadata supplies the primary path to Settings, dashboard recommendations, topics, and practice defaults. Progress and attempts are account-owned independently of paths. Lesson reads use RLS plus owner filters; privileged writes verify identity. Practice inserts response, server grade, and canonical hash together; per-owner uniqueness arbitrates retries. No schema, grants, migrations, or remote records changed.

Bookmark confirmation now rejects a started record whose returned section differs from the requested position. Completion still wins over stale bookmarks. Added regression coverage for failed confirmation, retry, concurrent completion, and browser coverage that completion and grade totals survive changing to a path excluding the lesson.

Local results: `npm test` passed 91 tests across 14 files; `npm run lint`, `npm run typecheck`, `npm run test:content`, and `NEXT_DIST_DIR=.next/verification npm run build` passed. Content validation covers six paths/eight topics/six lessons/thirteen questions structurally, not editorial review. Edge browser checks with two workers passed 27 cases each on desktop, mobile, and tablet (81 total). The first desktop invocation passed all cases but stalled during Windows process cleanup and was interrupted; mobile/tablet ran separately with process-sandbox escalation and exited successfully. An initial TypeScript run raced generated files during test-server startup; rerunning passed. Development logs included aborted-stream messages without failing browser assertions. Mobile dashboard visual inspection and automated viewport/accessibility/keyboard checks passed. Next's incidental output-directory edits were removed from tracked configuration. No hosted persistence, PostgreSQL constraints/RLS, or remote concurrency checks ran.

Current redacted local inspection supersedes the historical missing-key diagnosis below: primary public/server configuration passes format checks, which do not prove matching keys or connectivity. Both environment files are ignored/untracked. Isolation configuration has a different origin and only public URL/key; no disposable server key, dedicated test-account credentials, or complete study-test configuration was available. A different origin proves separation, not disposability. No remote connection was attempted.

Hosted setup still required: privately confirm the disposable project's dashboard reference/designation and already-installed reviewed Step 3C schema/grants/catalog. Do not migrate or repair them under this task. Create the separate ignored `.env.study-test.local` described below using that project's own public URL/key, server key, unused port/APP_URL, and isolated build directory. Keep `.env.isolation.local` public-only and `.env.local` unchanged. Supply two dedicated confirmed accounts through local secret handling, never chat. Before launching, recheck target separation and ensure the child process does not inherit primary Supabase configuration.

Pending hosted checks: distinct saved paths; refresh/sign-out/sign-in persistence; agreement across Settings/dashboard/topics/practice; progress/history preservation across paths and new sessions; two-user and anonymous read/write denial with positive controls; concurrent identical and changed-payload submissions with row-count/grade confirmation; bookmark/completion races; failed saves and retries. Use only dedicated test-owned records, compare the other account before/after mutation probes, and do not run the earlier SQL fixture-creation block for this task. Local fixtures cannot establish PostgreSQL RLS, uniqueness, or hosted persistence.

Step 3 remains incomplete: password recovery; persistent study/appearance settings; validated timezone and optional interview date; multiple selected paths/onboarding; fresh-auth account deletion with cleanup/retention verification; hosted application/isolation/concurrency checks and actual generated database types. Reviewed curriculum and objective evidence/mastery remain later work. Phase 1 is not complete.

Interview Compass contains the frontend prototype and Step 3B email/password authentication with Supabase SSR sessions. The user reports Step 3C migration, audit, ten two-account isolation API checks, and final fingerprint comparison passed. Step 3D now implements persistent lesson reading activity, server-graded practice/history, and shared account-specific progress metrics. Hosted application verification remains pending. Mastery, password recovery, account deletion, AI, runner, and deployment remain unimplemented.

The implementation intentionally stops before the complete Phase 1 product in [PRD.md](PRD.md). The former public-answer/local-grading prototype has been replaced by a server-only bank and authenticated practice workflow. Previously public keys are not secure assessment content; reviewed publication and the full evidence/mastery transaction pipeline remain required.

## Stack and setup

Next.js App Router supplies routes, layouts, and React rendering. TypeScript describes data and component props. Tailwind CSS provides design tokens and utility classes. Small shadcn/ui primitives live in the repository, and Lucide React supplies icons. React state is sufficient for the interactions in this prototype.

Node **24.22.1** and npm **11.19.1** are pinned in `.nvmrc`, `package.json`, and the package-manager field. Install those versions and ensure `node --version` and `npm --version` work in your terminal. Reopen your terminal or editor after installing Node if needed.

```bash
npm ci
npm run dev
```

Open the local URL printed by Next.js, normally `http://localhost:3000`.

Dependencies and `package-lock.json` are present; use npm as the only package manager and `npm ci` for reproducible installation. Study routes require a signed-in Supabase user and public configuration; persistent study operations also require the server-only key documented under Step 3D.

### Step 3A: Supabase connection setup

Keep the existing `.env.local` in the repository root. For a new checkout, copy `.env.example` to `.env.local` and replace its placeholders with the project's `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Next.js loads this file automatically. Never put a secret/service-role key in a `NEXT_PUBLIC_` variable. Publishable keys are intentionally usable in browser code; future data security still depends on grants and RLS. See the [official Supabase key guide](https://supabase.com/docs/guides/getting-started/api-keys).

- `src/lib/supabase/client.ts`: lazy anonymous client factory for browser-compatible/shared code. Validates public configuration and returns fixed, redacted diagnostics.
- `src/lib/supabase/server.ts`: request-scoped, `server-only` cookie client used by Step 3B; no global server session or privileged key.
- `npm run check:supabase`: uses Node's `--env-file` loader and verifies initialization without printing URLs, keys, or client objects. It makes no API requests and does not verify remote connectivity or permissions.

The stateless client used by the initialization script still disables sessions. The SSR server client now persists and refreshes user sessions as described below. No application tables or generated schema types are added in Steps 3A–3B.

Verify local protection with `git check-ignore .env.local` and ensure `git ls-files .env.local` returns nothing. `.env*` is ignored; the placeholder-only `.env.example` is explicitly allowed. Do not log or commit `.env.local`.

### Step 3B: Authentication and dashboard configuration

`/signup` collects first name, last name, normalized email, and password. Names are stored only in Supabase Auth metadata (`first_name`, `last_name`); no profile table is created. Verified `getUser()` data supplies the displayed name/email. Older accounts fall back to existing `full_name`/`name` metadata or the neutral label “Learner.” Metadata is display data and cannot authorize access. `/login` uses Supabase's password API; passwords are never stored, hashed, or logged by the app. `/auth/callback` exchanges PKCE codes or verifies signup/email-change token hashes. All study URLs remain protected. Logout is POST-based. Account names and the primary career path persist; other study/appearance preferences remain temporary.

Settings has a separate **Account Management** section for name updates and email-change requests. Each server action validates its inputs, checks origin/rate limits, and obtains a fresh verified actor; no client-selected account ID is used. Successful name changes revalidate the workspace immediately. Current email stays visible while `new_email` awaits confirmation. Explicit `user_already_exists` signup errors may show a duplicate-account message and login link; successful/obfuscated signup responses always use neutral wording. No user directory or database lookup is made to discover accounts. A synchronous submit guard plus pending-state controls prevent duplicate signup submissions.

Set server-only `APP_URL` to the exact app origin, for example `http://localhost:3000` locally or `https://your-domain.example` in production. Local development also accepts `127.0.0.1:3000` when APP_URL is unset. Production requires an explicit origin; other ports require APP_URL. No Host header or arbitrary `next` URL is used to construct email destinations.

Configure these manually in the Supabase dashboard:

1. **Authentication / Sign In & Providers:** enable Email/password signup and **Confirm email**. Set a password minimum of at least 8 characters; configure stronger password controls as appropriate. Do not enable anonymous sign-in or OAuth for this slice.
2. **Authentication / URL Configuration:** set **Site URL** to APP_URL and add the exact `${APP_URL}/auth/callback` redirect URL. For local development, add the localhost/127.0.0.1 origins actually used; avoid broad production wildcards. Confirm the default confirmation email preserves the requested RedirectTo URL.
3. **Authentication / Email Templates / Confirm signup:** the default confirmation URL supports same-browser PKCE. For links that also work on another device, use `<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Confirm email</a>`. This deliberately returns to `/dashboard`; do not insert arbitrary external next URLs. Test the selected template with real delivery.
4. **Email delivery and abuse controls:** configure production SMTP/sender details, Auth rate limits, and session/token policies. Verify expiry and refresh behavior in a development project before rollout. Hosting-level IP limits are also required before public production use.

Keep **Secure email change** enabled so changes require confirmation from both the current and new inbox. Retain the default Change Email `ConfirmationURL` template for PKCE, or test a token-hash template using `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email_change`. The callback handles partial dual confirmations without claiming the address changed early, and sends completed email changes to Settings. Both flows use the same allowlisted callback origin. Do not weaken confirmation/account-enumeration settings merely to reveal duplicate registrations. Hosted delivery and both-link behavior must be verified against the actual project settings.

#### Account deletion: unavailable until the backend is configured

No server-only admin credential is configured in the current environment. Settings therefore shows a destructive-action warning and an explicit unavailable message, with no deletion button, form, or backend mutation. Adding a credential alone does not enable deletion. No account is deleted during tests. Requests to an unimplemented `/api/account` deletion endpoint return 404, including unauthenticated requests and forged target IDs; this is not verification of a future active deletion workflow.

Before exposing deletion, implement and review all of these requirements in the existing architecture:

- A protected, rate-limited server operation verifies origin, current Supabase identity, exact `DELETE` confirmation, and recent authentication or immediate Supabase reauthentication tied to the same actor. Reject arbitrary client account IDs and preserve any required MFA assurance.
- A narrow `server-only` admin adapter uses a server secret/service-role key with Supabase's supported `auth.admin.deleteUser(actor.id)` method. Never publish that key or use it for general account/settings reads. Keep the UI disabled until confirmation and reauthentication requirements are satisfied.
- Inventory the actual owned database/storage graph before enabling deletion. Follow DATABASE_SCHEMA.md for cancellation, dependency order, cleanup, and resumable failure handling; future progress/research/jobs must join this workflow before being enabled. Do not promise deletion of unrelated/shared curriculum.
- Confirm the Auth deletion result and remaining owned-resource cleanup before reporting success. Preserve a minimal deletion request/tombstone outside removed data for recovery after partial failures. Clear session cookies and redirect publicly only after confirmed deletion; retry failed cleanup without resurrecting user data.
- Document actual provider, storage, backup retention and deletion limits before release. Test fully populated synthetic accounts, wrong/absent confirmation, stale authentication, forged IDs, provider/cleanup failures, retry behavior, and isolation. Active deletion authorization/reauthentication and cleanup tests remain deferred while the backend is unavailable.

Sessions use HttpOnly, SameSite=Lax cookies and Secure on HTTPS; HTTP is limited to loopback development. This slice has no browser-side authenticated SDK, so client code never reads session tokens. The proxy refreshes before rendering and preserves refreshed/cleared cookies on redirects. Proxy and protected layout use server-confirmed `getUser()` identity, not `getSession()` authorization. Responses are private/no-store. Logout clears local cookies and revokes the refresh session through Supabase; an already issued access token may remain valid until its provider-configured expiry.

Security limits: the bounded in-memory auth limiter allows 10 attempts per normalized email and 60 per trusted IP/shared local bucket per 10 minutes per process. It is not a distributed serverless limit; verify Supabase and hosting limits before production. IP metadata is trusted only behind Vercel ingress. Server Actions enforce request origin, validate inputs, and cap request bodies at 16KB. Production headers block framing, unsafe base/form destinations, content-type sniffing, and referrer leakage; a complete nonce-based script CSP remains future hardening. No RLS or cross-user database isolation is claimed before tables exist.

Dependency review (2026-10-21): `npm audit --omit=dev` reports no vulnerabilities. The full audit reports five high-severity package-chain findings from the existing ESLint/fast-glob/micromatch dependency on `braces` ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)); the advisory lists no patched version. This is development tooling, not a runtime auth dependency. Do not pass untrusted glob patterns to this tooling. Track the upstream fix and recheck before release; do not apply npm's suggested incompatible Next.js lint-config downgrade automatically. No exploit or production-readiness claim is made by this review.

Verification uses unit mocks and a local GoTrue-shaped HTTP fixture with the actual SSR adapter, not hosted accounts. `npm run test:e2e` starts that fixture on 54329 and an isolated Next.js app on 3100 using `.next/e2e`; it never reuses the developer server or .env.local credentials. Existing learning-flow tests first sign in with synthetic accounts. Hosted signup, SMTP/template delivery, actual token revocation/refresh, dashboard configuration, production HTTPS/headers, and multi-instance limits require separate verification. Password recovery and account deletion remain planned.

The manual scaffold preserves the existing repository and documents. It follows the official [Next.js installation guide](https://nextjs.org/docs/app/getting-started/installation), [Tailwind Next.js guide](https://tailwindcss.com/docs/installation/framework-guides/nextjs), and [shadcn/ui manual setup](https://ui.shadcn.com/docs/installation/manual). Next.js 16 uses asynchronous route parameters and a separate ESLint command.

### Step 3C-1: Prepared database migration

[20261021200000_prepare_learning_records.sql](supabase/migrations/20261021200000_prepare_learning_records.sql) and [learning_records.sql](supabase/tests/learning_records.sql) were **prepared, not executed by Step 3C-1**. See Step 3C-2 below for the subsequent user-reported application. The exact staged schema and access rules are in [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md#prepared-step-3c-1-subset). At that preparation handoff the app still used mock progress; Step 3D below replaces it. Auth/settings code was unchanged. No CLI, database packages, containers, or generated types were installed/created by that preparation step.

**Apply locally later:** first review the SQL and target inventory. This initial migration intentionally fails if its tables/functions already exist; do not hide collisions with `IF NOT EXISTS`. With a supported standalone Supabase CLI, Docker, and `psql` available, follow the [official local migration workflow](https://supabase.com/docs/guides/local-development/database-migrations) in a disposable, unlinked local project. Run `supabase init` only if `supabase/config.toml` is absent, then `supabase start` (initial startup can already apply migrations). Apply any remaining migrations and inspect SQL with:

```powershell
supabase migration up --local
supabase db lint --local
# Set LOCAL_SUPABASE_DB_URL to the disposable LOCAL stack's postgres-owner connection.
$localDatabase = [uri]$env:LOCAL_SUPABASE_DB_URL
if ($localDatabase.Host -notin @('127.0.0.1', 'localhost')) { throw 'Local test database required.' }
psql --dbname="$env:LOCAL_SUPABASE_DB_URL" --set=ON_ERROR_STOP=1 --file=supabase/tests/learning_records.sql
```

The SQL assertions use two owners, a third bootstrap identity, missing identity, and `anon`; they check isolation, protected columns/writes, session ownership, version consistency, invalid records, assignment uniqueness, and a synthetic deletion cascade, then roll back. They are plain `psql` assertions, not a pgTAP suite. Also verify the Data API with synthetic JWTs before enabling persistence. None of these runtime checks has run here; static review cannot establish RLS behavior. Generate types from the validated local schema using `supabase gen types typescript --local --schema public` and save the output to `src/lib/supabase/database.types.ts`; do not handwrite or guess them. Keep all connection secrets out of commits/logs.

At the Step 3C-1 handoff, profile bootstrap and persistence were deferred. Step 3D below now implements verified-actor profile bootstrap, lesson activity, and immutable free-practice submissions. Secure assessments and mastery still require reviewed content/keys, atomic evidence/audit/concurrency rules, and the PRD mastery algorithm. In account deletion, remove attempts before their referenced sessions and Auth identity. No interview research tables or production application are authorized by this preparation. Any later migration application needs target/schema/history review and explicit authorization; do not reapply the already-installed schema.

**Rollback:** failure before `COMMIT` rolls back the migration transaction. After successful application, prefer retaining the unused schema and a reviewed forward correction. For an unwanted disposable-local installation, recreate the local database from the previous source revision, acknowledging loss of local test data. Shared environments require backup and a separately reviewed reverse migration that removes only this migration's objects in dependency order; never drop `auth.users`, the Auth schema, or an existing private schema. `migration repair` changes history and is not a database rollback. Do not edit an already-applied migration. Namespace creation and catalog seed inserts are idempotent where appropriate; the complete migration is applied once through migration history.

### Step 3C-2: Review and application handoff

Review status: the user reports that the Step 3C-1 migration and read-only security audit succeeded on their Supabase project. This hosted result has not been independently observed here; the preparation-only statements above describe the earlier handoff. Do not reapply the migration or rerun preflight against the installed schema. Static review found RLS on all ten tables, owner predicates using `auth.uid()`, restricted profile-column grants, protected server-written evidence, indexed foreign keys, and same-owner session references. Lexical/structural checks, SQL documentation links, and `git diff --check` passed; these are not PostgreSQL execution or SQL parser checks. No migration SQL was changed by this review. **The user reports ten isolation API checks and unchanged fingerprints passed. No additional hosted checks were run here.** This does not complete AUTH-01's hosted isolation requirement.

Two metadata-only SQL files support the handoff:

| File | When to run | Purpose |
| --- | --- | --- |
| [learning_records_preflight.sql](supabase/tests/learning_records_preflight.sql) | Before application, in the intended project's SQL Editor | Confirm Auth/roles and reject conflicting public objects or an existing private schema. |
| [learning_records_security_audit.sql](supabase/tests/learning_records_security_audit.sql) | After application, in the same project's SQL Editor | Assert table/RLS/API grant configuration and list policies, constraints, and indexes for review. |

Both use read-only transactions and select no user records or secrets. Preflight deliberately stops on an existing `private` schema: the migration revokes its API usage, which could affect unrelated objects. Do not drop that schema or bypass the error; review its ownership, objects, and grants first. Review existing migration history separately; a passed preflight does not establish project identity or authorization. If a query fails, stop rather than changing existing records to make it pass.

**Safest hosted application sequence:**

1. First complete the disposable-local migration, lint, and transactional SQL tests above. Use a development/staging project before any project containing real users. Confirm the dashboard project reference and available backup/recovery procedure.
2. In that project's **SQL Editor**, run the complete preflight file. Review any collisions and existing migration history. Under the project's Data API settings, keep `private` out of exposed schemas; do not change Auth settings for this migration.
3. Obtain explicit approval for this exact migration and target. Then, with a supported standalone CLI installed/configured, use the [official migration workflow](https://supabase.com/docs/guides/deployment/database-migrations):

   ```powershell
   supabase login
   supabase link --project-ref <confirmed-development-project-reference>
   supabase migration list --linked
   supabase db push --linked --dry-run
   # Run ONLY after explicit approval and review of the dry run:
   supabase db push --linked
   ```

   The dry run must show only `20261021200000_prepare_learning_records.sql` pending. Stop on other migrations or history mismatches. Use interactive credential entry, never command-line passwords or secrets pasted into chat. Linking requires `supabase/config.toml`; initialize it with `supabase init` if still absent. No CLI setup, link, or push was performed here. Prefer the CLI's migration history over manually pasting DDL into SQL Editor; if it was already applied manually, stop and reconcile history after checking the schema, rather than applying twice or blindly marking it applied.
4. Run the complete read-only security audit in SQL Editor. Expect seven owner policies: three on profiles (SELECT/INSERT/UPDATE), one SELECT policy on each other owned table, and none on catalog tables. Check `USING`/`WITH CHECK` owner predicates and validated constraints against the migration. A dashboard SQL query runs with privileged access and does **not** prove learner isolation.
5. Before declaring Step 3C-2 verified, test the actual Data API in a separate disposable Supabase environment using two isolated Auth accounts created through supported signup, their own session tokens, and the public publishable/anon key. Use a controlled owner connection only to seed those accounts' profiles/activity. Never test RLS with a service-role bearer token. Test A against B and B against A: reads return no foreign records; profile updates affect no foreign rows; foreign inserts fail; all activity writes and all raw-attempt reads fail; owner-ID transfers and anonymous CRUD fail. Confirm allowed own-profile insertion/update and own safe reads succeed. Failed DELETE requests must leave fixtures intact. Record status codes, affected-row counts, and owner-side before/after checks, without logging tokens or private data.

The expanded [transactional SQL suite](supabase/tests/learning_records.sql) also covers explicit foreign inserts, updates, and deletes. It simulates database roles/claims, not hosted Auth sessions. **Never run that fixture script on the live project:** it inserts synthetic Auth rows and exercises deletion, despite ultimately rolling back. Hosted safe-account isolation tests and generated database types remain pending. Existing authentication needs no table trigger/backfill; profile bootstrap and all progress integration remain deferred. No frontend, credentials, or existing database records were changed here.

### Step 3C-2: Two-account isolation procedure

Run this procedure only in a **disposable development/staging Supabase project** with the same migration and a successful read-only audit. Do not run its write probes on production: an access-control defect could make an expected denial succeed. The procedure targets only two newly created test identities, never existing learners. It adds no packages, changes no schema, and uses the installed Supabase JavaScript SDK. It does not run `learning_records.sql`, delete Auth accounts, or automatically clean up records.

1. In that disposable project's **Authentication > Users**, create two new confirmed email/password test accounts, A and B, with distinct emails. Use a supported signup/dashboard flow; do not insert into `auth.users` manually. Keep passwords local. Copy their UUIDs privately from the dashboard.
2. In the same project's **SQL Editor**, replace the two UUID placeholders below and run the complete block once. It refuses identities with existing profiles; no upserts, backfills, updates, or deletes are used. If it fails, stop; use fresh test accounts rather than changing existing records. It creates exactly one record per owned table per test account so empty-table reads cannot produce a false pass.

   ```sql
   begin;
   do $$
   declare
     account_a uuid := '9d652f11-ce18-4f4e-aac1-ed0800b576bd';
     account_b uuid := '6cfc9893-2f01-4625-907f-2b8797e833e3';
     account_id uuid;
     session_id uuid;
   begin
     if account_a = account_b or
       (select count(*) from auth.users where id in (account_a, account_b)) <> 2 or
       exists (select 1 from public.profiles where id in (account_a, account_b)) then
       raise exception 'Two distinct fresh Auth test accounts without profiles are required';
     end if;
     foreach account_id in array array[account_a, account_b] loop
       insert into public.profiles(id, display_name) values (account_id, 'Isolation check');
       insert into public.lesson_progress(user_id, lesson_id, lesson_version_id)
         values (account_id, 'b967d196-6dea-55c9-a35c-cbbd82b654b9', '3de4e9ff-3252-56ac-89ee-4a5be72ebfab');
       insert into public.study_sessions(user_id, kind) values (account_id, 'practice') returning id into session_id;
       insert into public.question_attempts(user_id, question_id, question_version_id, study_session_id, assignment_key)
         values (account_id, 'd6946209-76b6-59b4-beff-8c0a6251fda9', 'bad65157-3d32-562e-9981-810904d238f7', session_id, gen_random_uuid());
       insert into public.user_topic_mastery(user_id, topic_id, algorithm_version, alpha, beta, estimate,
         eligible_attempt_count, distinct_question_count, distinct_evidence_days)
         values (account_id, 'd1fbfb4b-c7ba-5fa1-87b3-9ace0a559467', 'isolation-test', 1, 1, 0.5, 0, 0, 0);
     end loop;
   end;
   $$;
   commit;
   ```

3. Capture a baseline in SQL Editor using the query below with those same UUIDs. Keep the result locally; each table should show `record_count = 2`. Run this identical query again after the probes and compare every count and fingerprint. It selects only the dedicated test identities. **Unchanged fingerprints are required**, including attempts, which learners cannot read directly.

   ```sql
   with test_ids(id) as (values ('9d652f11-ce18-4f4e-aac1-ed0800b576bd'::uuid), ('6cfc9893-2f01-4625-907f-2b8797e833e3'::uuid)),
   records(table_name, value) as (
     select 'profiles', to_jsonb(r)::text from public.profiles r join test_ids t on t.id = r.id
     union all select 'lesson_progress', to_jsonb(r)::text from public.lesson_progress r join test_ids t on t.id = r.user_id
     union all select 'study_sessions', to_jsonb(r)::text from public.study_sessions r join test_ids t on t.id = r.user_id
     union all select 'question_attempts', to_jsonb(r)::text from public.question_attempts r join test_ids t on t.id = r.user_id
     union all select 'user_topic_mastery', to_jsonb(r)::text from public.user_topic_mastery r join test_ids t on t.id = r.user_id
   )
   select table_name, count(*) as record_count, md5(string_agg(value, E'\n' order by value)) as fingerprint
   from records group by table_name order by table_name;
   ```

4. Create an ignored `.env.isolation.local` in the repository root containing only the disposable project's `NEXT_PUBLIC_SUPABASE_URL` and **publishable** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Leave the application's `.env.local` unchanged. Confirm `git check-ignore .env.isolation.local` lists this file. Do not use a secret/service-role key. In PowerShell at the repository root, run the following complete block. Enter credentials only at the prompts; passwords are hidden, temporarily passed to the local Node process, and removed from the shell environment in `finally`. Do not run with shell tracing/transcripts enabled or paste credentials/results containing private data into chat.

   ```powershell
   if ((Read-Host 'Type DISPOSABLE to confirm this is a disposable test project') -cne 'DISPOSABLE') { throw 'Stopped' }
   $isolationVariables = @('ISOLATION_PROJECT_REF', 'ISOLATION_A_EMAIL', 'ISOLATION_A_PASSWORD', 'ISOLATION_B_EMAIL', 'ISOLATION_B_PASSWORD')
   try {
     $env:ISOLATION_PROJECT_REF = Read-Host 'Disposable project reference (from its dashboard)'
     foreach ($label in @('A', 'B')) {
       [Environment]::SetEnvironmentVariable("ISOLATION_${label}_EMAIL", (Read-Host "Test $label email"), 'Process')
       $isolationPassword = Read-Host "Test $label password" -AsSecureString
       [Environment]::SetEnvironmentVariable("ISOLATION_${label}_PASSWORD", ([System.Net.NetworkCredential]::new('', $isolationPassword).Password), 'Process')
       $isolationPassword.Dispose()
     }
   @'
   import { createClient } from '@supabase/supabase-js';
   const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
   const check = (condition, label) => { if (!condition) throw new Error(label); };
   const clients = [];
   const denied = async (request, label) => {
     const result = await request;
     // Constraint, network, token, and missing-table errors are not proof of authorization.
     check(result.error?.code === '42501', label);
   };
   try {
     check(new URL(url).origin === `https://${process.env.ISOLATION_PROJECT_REF}.supabase.co`, 'Target mismatch');
     check(key?.startsWith('sb_publishable_'), 'A public publishable key is required');
     const makeClient = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
     const accounts = [];
     for (const label of ['A', 'B']) {
       const client = makeClient(); clients.push(client);
       const login = await client.auth.signInWithPassword({ email: process.env[`ISOLATION_${label}_EMAIL`], password: process.env[`ISOLATION_${label}_PASSWORD`] });
       delete process.env[`ISOLATION_${label}_PASSWORD`];
       check(!login.error, `Test ${label} login failed`);
       const verified = await client.auth.getUser();
       check(!verified.error && verified.data.user, `Test ${label} identity verification failed`);
       accounts.push({ client, id: verified.data.user.id });
     }
     check(accounts[0].id !== accounts[1].id, 'Distinct test accounts required');
     const tables = ['profiles', 'lesson_progress', 'study_sessions', 'question_attempts', 'user_topic_mastery'];
     const owner = table => table === 'profiles' ? 'id' : 'user_id';
     const payload = (table, id) => ({
       profiles: { id, display_name: 'Isolation probe' },
       lesson_progress: { user_id: id, lesson_id: 'b967d196-6dea-55c9-a35c-cbbd82b654b9', lesson_version_id: '3de4e9ff-3252-56ac-89ee-4a5be72ebfab' },
       study_sessions: { user_id: id, kind: 'lesson' },
       question_attempts: { user_id: id, question_id: 'd6946209-76b6-59b4-beff-8c0a6251fda9', question_version_id: 'bad65157-3d32-562e-9981-810904d238f7', assignment_key: crypto.randomUUID() },
       user_topic_mastery: { user_id: id, topic_id: 'd1fbfb4b-c7ba-5fa1-87b3-9ace0a559467', algorithm_version: 'isolation-test', alpha: 1, beta: 1, estimate: 0.5, eligible_attempt_count: 0, distinct_question_count: 0, distinct_evidence_days: 0 },
     })[table];
     // Validate both fresh fixture profiles before sending ANY mutation probe.
     for (const { client, id } of accounts) {
       const profile = await client.from('profiles').select('id,display_name').eq('id', id);
       check(!profile.error && profile.data?.length === 1 && profile.data[0].display_name === 'Isolation check', 'Fresh fixture profile missing');
     }
     for (const [index, { client, id }] of accounts.entries()) {
       const other = accounts[1 - index].id;
       for (const table of tables) {
         const label = `${index === 0 ? 'A' : 'B'}: ${table}`;
         const read = client.from(table).select(owner(table)).in(owner(table), [id, other]);
         if (table === 'question_attempts') await denied(read, `${label} raw read not denied`);
         else {
           const result = await read;
           check(!result.error && result.data?.length === 1 && result.data[0][owner(table)] === id, `${label} read isolation failed`);
         }
         await denied(client.from(table).insert(payload(table, other)), `${label} foreign insert not denied`);
         if (table === 'profiles') {
           const update = await client.from(table).update({ display_name: 'Isolation probe' }).eq('id', other).select('id');
           check(!update.error && update.data?.length === 0, `${label} foreign update failed isolation`);
           await denied(client.from(table).update({ id: other }).eq('id', id), `${label} owner transfer not denied`);
         } else {
           // Do not chain .select(): a SELECT denial could mask an allowed write.
           await denied(client.from(table).update({ user_id: id }).eq('user_id', other), `${label} foreign update not denied`);
           await denied(client.from(table).insert(payload(table, id)), `${label} own trusted insert not denied`);
         }
         await denied(client.from(table).delete().eq(owner(table), other), `${label} foreign delete not denied`);
         const anonymous = makeClient();
         await denied(anonymous.from(table).select(owner(table)).eq(owner(table), id), `${label} anonymous read not denied`);
         await denied(anonymous.from(table).insert(payload(table, id)), `${label} anonymous insert not denied`);
         await denied(anonymous.from(table).update(table === 'profiles' ? { display_name: 'Isolation probe' } : { user_id: other }).eq(owner(table), id), `${label} anonymous update not denied`);
         await denied(anonymous.from(table).delete().eq(owner(table), id), `${label} anonymous delete not denied`);
         console.log(`PASS ${label}`);
       }
     }
     console.log('API checks passed. Verification still requires matching SQL baseline fingerprints.');
   } catch (error) {
     // Only our static labels are printed; never emit provider responses or credentials.
     console.error('FAIL: isolation checks did not complete. Stop and review locally.');
     if (error instanceof Error && !error.message.includes('://')) console.error(error.message.startsWith('A:') || error.message.startsWith('B:') ? error.message : 'Check target, login, and fixtures.');
     process.exitCode = 1;
   } finally {
     await Promise.allSettled(clients.map(client => client.auth.signOut({ scope: 'local' })));
   }
   '@ | node --env-file=.env.isolation.local --input-type=module
     if ($LASTEXITCODE -ne 0) { throw 'Isolation verification failed; inspect only test records.' }
   } finally {
     foreach ($name in $isolationVariables) { [Environment]::SetEnvironmentVariable($name, $null, 'Process') }
   }
   ```

5. Repeat the SQL fingerprint query from step 3. Require five identical counts/fingerprints, ten `PASS` lines (five tables in each direction), and exit code zero. A denial must be PostgreSQL `42501`; a duplicate-key/validation error is not a pass. Record the project/environment, timestamp, migration version, audit result, API result, and fingerprint comparison without emails, passwords, JWTs, or user rows. Leave fixtures in the disposable environment; this procedure performs no cleanup deletion. A failed check stops the run: inspect only test fixtures and report the failure before changing policies.

**Completion and limits:** the user reports Step 3C migration, audit, ten isolation API checks, and unchanged fingerprints passed. This procedure remains available for reproduction; no hosted run was independently observed here. Passing proves the tested direct Data API operations for this schema/environment at that time, not every future endpoint or production readiness. Raw attempts are denied even to owners; own safe reads are positive controls. Profile bootstrap/own-profile updates, application server authorization, RPCs, Storage, token expiry/revocation, concurrent transactions, and deletion cascades are outside this small check. A disposable project's result does not independently prove the live project's behavior; compare its migration/audit configuration and keep live write probes prohibited. Use the official [password sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [verified user](https://supabase.com/docs/reference/javascript/auth-getuser), and [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) references when maintaining this procedure.

Procedure validation: PowerShell and embedded JavaScript syntax checks passed, as did `git diff --check`. Offline simulations confirmed that the normal expected responses pass and foreign-read leakage, foreign-update leakage, and an unrelated duplicate-key denial fail. These simulations do not execute PostgreSQL or verify hosted RLS. No application tests/build were run for this documentation-only change.

### Step 3D-1: Persistent lesson progress

Lesson pages now load the authenticated learner's saved reading activity. **Start lesson** creates an owner profile only if missing and starts a lesson idempotently. Choose a section and **Save my place**, then **Resume lesson** follows the saved anchor after refresh or sign-in. **Mark lesson complete** is permanent for this version; retries/stale bookmarks cannot reset completion or its timestamp. Missing progress has an honest not-started state. Errors keep the lesson readable and offer retry; updates disable controls while pending. No lesson activity raises mastery. Step 3D below connects completion to real account summaries.

The adapter in `src/server/learning/lesson-progress.ts` verifies `getUser()` at each read/write entry point, validates lesson IDs/section bounds against existing content, and rejects client-selected owners/unknown fields. It resolves shared version-1 UUIDs from the existing catalog. A private, stateless privileged client performs only actor-scoped profile/progress writes; the user's SSR client performs RLS-protected reads. Server Actions additionally check origin; mutations use a separate process-local per-user/lesson and IP burst limiter. Production still needs hosting-level distributed limits. Profile insertion, initial progress insertion, and conditional updates are individually idempotent/retry-safe, not one multi-table transaction; partial failures report an error and can be retried. Concurrent bookmarks are last-write-wins; completion wins over later bookmarks. Sample lesson content remains unreviewed and publicly readable. Version 1 must not be repurposed when publishing changed curriculum.

**Manual setup:** in the same Supabase project's API Keys settings, obtain a server **secret key** (`sb_secret_...`). Add `SUPABASE_SECRET_KEY` to ignored `.env.local` and the server hosting environment; restart Next.js. Never prefix it with `NEXT_PUBLIC_`, put it in `.env.isolation.local`, paste it into chat, or use it in a browser. Keep the existing publishable URL/key and `APP_URL`. The app deliberately fails closed with a generic progress error if the server key is missing. No migration, RLS relaxation, Auth trigger, new package, or dashboard schema edit is required. See [Supabase's server administration guidance](https://supabase.com/kb/troubleshooting/performing-administration-tasks-on-the-server-side-with-the-servicerole-secret-BYM4Fa). No real key was created or edited by this task.

**Verification:** focused unit tests cover validation, origins, authentication before privileged access, ownership filters, profile bootstrap, idempotent start, conditional updates, safe errors, read-back confirmation, and rate limits. Playwright uses a local synthetic Auth/PostgREST-shaped fixture (not hosted SQL) for start/bookmark/completion across refresh/logout/relogin, a second account, error/retry, viewport fit, and accessibility. Do not interpret these mocks as new PostgreSQL/RLS proof. After setting the real server key, verify the same learner flow with dedicated development accounts, ensure account B cannot see account A's markers, and follow the Step 3D summary checks below; mastery must remain unassessed. The prior Step 3C checks are user-reported; hosted application flow, multi-tab concurrency against PostgreSQL, and production limits remain unverified here. New lesson progress touches no schema, so no generated types were handwritten; generate actual schema types via the existing CLI workflow when tooling/access is available.

Results (2026-10-21): all 63 unit tests passed, including nine new boundary tests. Nine focused browser cases passed across desktop/mobile/tablet; saved-bookmark screenshots were inspected and accessibility/overflow assertions passed. Lint, TypeScript, production build, and a scan of 22 production browser JavaScript files for privileged-adapter configuration/synthetic key leakage passed. Browser checks use Edge with `--workers=2`; their fixture processes needed execution outside the restricted sandbox to terminate cleanly. These results are local, not hosted persistence verification.

### Step 3D: Persistent study progress

**2026-10-22 dashboard diagnosis:** the local setup check reports valid-format public configuration and `server_key_missing`. Authentication can work while study persistence fails because the existing grants reserve catalog access and attempt writes for the server. Reloading alone cannot supply a missing key. No environment file was opened or edited, and no remote database request or migration was performed during this diagnosis.

Run `npm run check:study` in the repository. It loads the selected local environment and reports fixed configuration status only: no values, raw errors, account access, or network requests. Missing keys, empty keys, wrong key types, and copied server placeholders fail with exit code 1. This checks format, not key validity or project matching. A successful check still requires the disposable hosted smoke test below. For that environment use `node --conditions=react-server --env-file=.env.study-test.local scripts/check-study.ts`; ordinary app/test commands never load that file automatically.

To resolve the current setup blocker, obtain the **primary project's** server secret key from its API Keys settings, add `SUPABASE_SECRET_KEY` only to the existing ignored primary `.env.local`, run the check, then stop/restart the primary Next.js process and reload the dashboard. Keep the primary public URL/key and `APP_URL` unchanged. Use the disposable project's own complete configuration for hosted test work; never mix those keys or overwrite primary configuration. No schema or RLS change is needed. Server logs identify only a fixed failure stage/code; learner pages receive safe recovery messages. Framework control-flow exceptions are rethrown for Next.js to handle normally.

**Implemented:** lesson bookmarks/completion; authenticated server-graded multiple-choice history; saved ungraded self-review/code drafts; account-specific dashboard, progress, topic completion, recent activity, and UTC daily submission counts. No schema change or remote execution was needed. Existing Auth, settings, lesson content, and navigation remain in place. Preferences are still temporary.

The server-only sample bank is `src/data/mock/questions.ts`; `question-bank.ts` creates explicit public DTOs without keys, explanations, model answers, or solutions. `grade-answer.ts` is now server-only. Lesson checks and practice use the same authenticated submission boundary. Feedback is released only for the verified owner's committed attempt. Samples were public in the earlier prototype, so they are unsuitable for secure assessments or mastery evidence even though current browser payloads no longer contain the keys.

`getStudyAccess()` verifies `getUser()` before constructing a separate stateless secret-key client. Caller-supplied owners/scores are rejected. Each submission resolves the permanent question/version UUIDs from the database, validates the answer, and computes a canonical SHA-256 hash of version + exact response. One INSERT atomically stores the finalized response and server score/feedback. The existing per-user assignment/submission unique constraints arbitrate concurrency; same-key/same-payload retries return the original committed result, while changed payloads conflict. There are no UPDATEs to finalized grades. Self-review uses `submitted` with null score/grader/feedback; it is not executed or automatically assessed. Profile bootstrap is separately idempotent. A lost response can leave a committed attempt; reload/retry recovers it without duplicating the grade.

This is a bounded **free-practice** workflow, not the full timed-assessment assignment/evidence/mastery transaction. All new attempts have `response.practice_version = 1` and `evidence_eligible = false`. No mastery projection, evidence event, quota, schedule, or streak is written. Reviewed immutable publication, per-assessment assignments, correction events, and the full atomic mastery pipeline remain blocked on their separately reviewed implementation; these samples must never be used to bypass that gate.

Practice restore additionally restricts rows to submitted/graded free practice with `practice_version: 1`, rejecting records from other workflows before releasing feedback.

Only account-scoped random submission UUIDs are kept in sessionStorage; answers, feedback, tokens, and passwords are not stored there. Server restore verifies the currently authenticated actor. **Reset this visit / Try a new attempt** deliberately generates a new key without deleting history. Unsubmitted drafts remain temporary. With browser storage blocked or a closed tab, a new visit can create a new intentional attempt; same-request retries remain safe. The visit sidebar counts distinct questions checked in that visit, while dashboard/history count committed submissions, including intentional retakes.

`getStudyProgress()` is the shared read model for dashboard/progress/topics. It uses RLS for lesson reads and a narrow verified-owner projection for raw-attempt-restricted history, filtered to this practice workflow and finalized/submitted states. It never returns raw responses or private feedback in analytics. Stable UUID keyset pages request at most 500 rows and continue until an empty page, including when the API imposes a smaller cap. Non-advancing/duplicate rows fail safely rather than inflating totals. A source reaching 10,000 actual records fails with an error instead of presenting partial totals; server aggregate RPCs can replace this bound later. Summaries are request-time/eventually consistent during concurrent writes, not a multi-table snapshot transaction. Page revalidation keeps post-save navigation fresh.

Completion is measured against the six available lessons. Practice score is the average saved multiple-choice score; self-review is excluded. Daily bars count saved submissions by UTC date, not minutes studied. Recent history contains up to 20 entries and one latest update per lesson; it is not an exhaustive audit log. Mastery remains **Not assessed**. There are no fabricated streaks, estimated study-time totals, sample fallback metrics, or automatic reviews. Empty accounts show genuine zeros/empty states; unavailable data shows an error rather than zeros.

**Primary application setup:** keep `.env.local` pointed at the primary project. Ensure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SECRET_KEY` all belong to that same project; keep `APP_URL` correct. Obtain a secret key through Supabase API Keys settings, store it only in ignored/server environment configuration, then restart `npm run dev`. Never use a `NEXT_PUBLIC_` secret variable. No migration, RLS relaxation, new dependency, or account-administration permission is required. See the official [API key guidance](https://supabase.com/docs/guides/getting-started/api-keys).

**Keep hosted test configuration separate:** `.env.isolation.local` remains for the existing isolated API procedure and is never loaded by normal app code. To validate this new full application flow, use a separate ignored `.env.study-test.local` containing ALL five entries below, filled with the disposable project's configuration. Leave the primary `.env.local` unchanged and do not copy a primary-project secret into the test configuration.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://DISPOSABLE_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_DISPOSABLE_PLACEHOLDER
SUPABASE_SECRET_KEY=sb_secret_DISPOSABLE_PLACEHOLDER
APP_URL=http://localhost:3001
NEXT_DIST_DIR=.next/study-test
```

Confirm the test dashboard/project reference and that `git check-ignore .env.study-test.local` lists the file. With the pinned Node version, start the separate instance without editing the primary file:

```powershell
node --env-file=.env.study-test.local node_modules/next/dist/bin/next dev --port 3001
```

Use two fresh confirmed Auth accounts in that disposable project. As A: verify empty metrics, start a lesson, save a section, refresh/resume, complete it, answer a multiple-choice question, refresh/retry, and save a self-review/code draft. Dashboard/progress must agree; a repeated submission must not increase the count. Sign out/in and verify history remains. As B: confirm A's activity/results never appear. Check anonymous/raw attempt requests and client grade/owner injection remain denied. During these **authorized successful writes**, A's profile/progress/attempt fingerprints are expected to change; B's records must remain unchanged. Do not run the old destructive SQL fixture script or modify real learner accounts. No hosted operation was performed by this development task.

**Verification limitations:** local tests use synthetic Auth/PostgREST fixtures and mocked SDK transports, not PostgreSQL. Hosted app writes, database concurrency under real load, real session expiry/revocation, large-data performance, distributed production limits, and the full assessment/mastery pipeline remain unverified. SQL/CLI tooling is not available here. Generate actual database types using the existing CLI workflow when access/tooling is provided; no generated types were invented. Rate limits remain process-local and require hosting-level protection before production. Existing dependency/security limitations elsewhere in this guide still apply. Adding the server key does not enable account deletion.

**Local validation (2026-10-21):** 79 unit tests passed across 12 files; content validation passed for six paths, eight topics, six lessons, and thirteen questions (structure only, not publication review). TypeScript, lint, and production build passed. The affected 45 browser cases were verified across desktop/mobile/tablet, including targeted reruns after correcting asynchronous test readiness. One additional capture run hit a generated Next.js JSON-manifest error; clearing only `.next/e2e` resolved it. Accessibility/overflow assertions and representative dashboard visual review accompany these checks. A scan of 22 production browser JavaScript files found no server-key configuration/synthetic key or private-explanation markers. These are local checks, not hosted security proof.

**Changed-file map for Step 3D (including the earlier lesson slice):**

**Follow-up validation (2026-10-22):** 85 unit tests passed across 13 files; structural content validation, lint, strict TypeScript, and the isolated production build passed. The complete 75-case Edge browser suite passed with two workers: desktop 25, mobile 25, tablet 25. Desktop/mobile/tablet dashboard captures were visually inspected; automated accessibility, overflow, increased-text, dark-mode, persistence, Auth/settings, retry, and isolation checks passed against local synthetic services. An initial combined run reached the unchanged shared-IP Auth limit; the runner now starts fresh app/fixture processes per viewport. Windows process-sandbox cleanup stalled an intermediate run, so the successful final browser execution used approved execution outside that sandbox. A targeted scan of 22 production client JavaScript files found no server-key configuration/synthetic-key or private-explanation markers. The local setup check confirmed `server_key_missing`; a synthetic valid-format configuration passed. None of these checks establishes hosted database behavior, and no remote schema, real account, or environment file was changed.

| Area | Created or updated files |
| --- | --- |
| Server data flow | `src/server/learning/access.ts`, `configuration.ts`, `lesson-progress.ts`, `practice-progress.ts`, `question-bank.ts`, `study-progress.ts` |
| Lesson feature | `src/features/curriculum/lesson-completion.tsx`, `lesson-progress-actions.ts`, `lesson-progress-types.ts`, `topic-library.tsx` |
| Practice feature | `src/features/practice/actions.ts`, `grade-answer.ts`, `practice-workspace.tsx`, `types.ts`; `src/data/mock/questions.ts`; `src/components/learning/quiz-question.tsx` |
| Progress UI | `src/features/progress/dashboard.tsx`, `summarize-progress.ts`, `types.ts`; `src/components/learning/activity-summary.tsx`, `topic-card.tsx`; `src/components/charts/study-activity.tsx`; `src/components/layout/app-shell.tsx` (sample-data copy) |
| Routes | Under `src/app/(workspace)`: `learn/page.tsx`, `learn/[topicSlug]/page.tsx`, `lessons/[lessonId]/page.tsx`, `lessons/[lessonId]/loading.tsx`, `practice/page.tsx`, `progress/page.tsx`, `progress/loading.tsx`, `dashboard/loading.tsx` |
| Tests | `tests/unit/lesson-progress.test.ts`, `practice-progress.test.ts`, `practice-actions.test.ts`, `study-progress.test.ts`, `content.test.ts`, `practice.test.ts`; `tests/e2e/lesson-progress.spec.ts`, `study-progress.spec.ts`, `learning-flow.spec.ts`, `navigation.spec.ts`; `tests/fixtures/supabase-auth-server.ts` |
| Setup/test tooling | `scripts/check-study.ts`, `scripts/run-browser-tests.mjs`, `tests/unit/study-configuration.test.ts`; `package.json` adds redacted diagnostics and browser-process isolation without new packages |
| Configuration/docs | `.env.example`, `playwright.config.ts`, `AGENTS.md`, `ARCHITECTURE.md`, `DATABASE_SCHEMA.md`, `DEVELOPMENT_ROADMAP.md`, `DEVELOPER_GUIDE.md`, `PRD.md`, `README.md` |

## Folder structure

```text
src/
  app/                    Routes, metadata, shared layout, and global styles
    (auth)/login/         Public sign-in and signup forms
    (auth)/signup/
    auth/callback/        Email confirmation handler
    (workspace)/          Protected study pages; route group does not change URLs
      dashboard/
      career-paths/
      learn/[topicSlug]/
      lessons/[lessonId]/
      practice/
      progress/
      settings/
  components/
    layout/               Sidebar, header, and mobile navigation
    learning/             Topic cards, quiz forms, feedback, activity
    charts/               Accessible study-activity display
    ui/                   Button, Card, and Progress primitives
  data/mock/              Sample curriculum, lessons, questions, progress
  server/auth/            Verified identity, trusted origins, local burst limits
  server/learning/        Verified-actor lessons, server grading, history, safe DTOs
  lib/supabase/           Stateless tooling client and cookie-aware server/proxy clients
  features/
    curriculum/           Path selection, topic filtering, content types
    practice/             Safe question/result types, server actions, practice state
    progress/             Dashboard composition
    settings/             Temporary preferences and settings form
  lib/                    Shared class-name helper
scripts/                  Content validation and redacted initialization check
tests/unit/               Auth boundaries, grading, and content-integrity tests
tests/e2e/                Authentication, learner flows, responsiveness, accessibility
tests/fixtures/           Local synthetic Supabase Auth HTTP fixture
```

`src/server/auth` contains the implemented auth boundary. `supabase/migrations` and `supabase/tests` contain the authorized Step 3C-1 preparation files. Migration application is user-reported. The Step 3D adapters above implement progress persistence against that existing schema; hosted verification remains pending.

## Routing and layouts

App Router creates URLs from folders under `src/app`; route groups in parentheses do not enter the URL. For example, `src/app/(workspace)/progress/page.tsx` renders `/progress`. Bracketed folders define dynamic segments. Unknown topic or lesson IDs call `notFound()` and show the recovery page.

`src/app/page.tsx` redirects `/` to `/dashboard`; unauthenticated requests are sent to `/login`. The protected workspace layout verifies the user and wraps study pages with the preference provider and shell. Layouts stay mounted during client navigation, so temporary preferences survive study links. Reload, logout, or an identity change resets this sample state. Auth pages use a separate focused layout.

`loading.tsx`, `error.tsx`, and `not-found.tsx` provide route-level loading and recovery states. Filtered topic and practice screens also have empty states with reset controls. The native mobile navigation disclosure can be opened and closed by keyboard; choosing a link closes it.

Future HTTP endpoints would live in `src/app/api/.../route.ts`. A route handler should validate identity and input, then call a server use case. No API routes are needed for this prototype.

## Server and Client Components

Components are Server Components by default. The lesson route renders written content and example code on the server. Its knowledge check is a smaller Client Component because it needs browser events and state.

A file beginning with `"use client"` defines a client boundary. Examples include the quiz form, topic filters, career-path selector, and settings. The application shell needs `usePathname()` to mark the current navigation link. Passing server-rendered page content as `children` through a Client Component does not turn every page module into a Client Component.

Client code is visible to the browser. Public question DTOs exclude answer keys, solutions, and explanations. The bank and grading run behind `server-only`; feedback is returned after a verified-owner submission commits. Previously published sample answers remain unsuitable for secure assessments or mastery evidence.

## Components and data flow

Routes stay small and compose feature components. Shared presentation belongs in `components/`; page-specific behavior stays in `features/`. For example:

1. `data/mock/curriculum.ts` exports typed topic records.
2. `TopicLibrary` filters those records using the search input and selected path.
3. `TopicCard` receives one topic through a prop, derives its real sample lesson count, and links to its topic route.
4. The route finds lessons by `topicId` and renders links to them.

`AppShell` shares one navigation definition across the persistent desktop sidebar and mobile disclosure. Its compact header aligns with the content width. `ProfileMenu` uses native disclosure semantics and normal Tab order, with Escape/focus return and outside-click/focus-leave dismissal. It displays the verified Auth profile and links to Settings; logout reuses the existing protected server action. The dashboard keeps account details in that menu and places the saved unfinished-lesson recommendation before its compact statistics.

`Button` adapts the shadcn/ui pattern. Its `variant` and `size` props choose styles. `asChild` uses Radix Slot to style a `Link` without creating a button nested around a link. `Card` provides a consistent surface. `Progress` uses native HTML progress semantics to avoid adding a chart or progress library.

## Saved career-path selection

Validation (2026-10-22): 90 unit tests and all 81 local browser cases passed (27 each on desktop/mobile/tablet), along with lint, TypeScript, structural content checks, and the isolated production build. New path tests cover refresh/login persistence, a separate account, Settings synchronization, selected-path dashboard/default filters, and failed-save recovery. Representative screenshots were inspected. Browser checks use synthetic services, not new hosted verification. A client-module reload interrupted one earlier name-save confirmation check; the final suite passed with source edits held steady. No additional credentials, environment changes, or database migrations are required for this fix.

The former local path default reset to Software Engineering after refresh and did not affect the server dashboard. The selected path now comes from validated verified-user metadata. Choosing a path saves it through `src/features/settings/career-path-actions.ts`; Settings uses the same boundary. Controls show pending/error states and keep the previous saved selection on failure. No database migration or new environment variable is required.

The dashboard displays the selected path, recommends available unfinished lessons within it in mapped subject order, and shows its topics. Study Topics defaults to that path; Practice defaults to its subjects in the same order. Explicit topic/all-topic browsing remains available. Overall completion, grades, and history are shared and are never reset by path changes. Paths still share the existing small foundational curriculum; this fix does not create new lessons. Missing/invalid saved IDs fall back to the first existing catalog path. Multi-path onboarding and other persisted preferences remain future work.

## State and persistence

| State | Location | Lifetime |
| --- | --- | --- |
| Name and email | Supabase Auth; verified server profile passed into the provider | Persists across sessions; changes refresh the workspace |
| Primary career path | Validated `career_path_id` in Supabase Auth metadata | Persists across refresh/logout/login; changes refresh the workspace |
| Study goal, explanation level, theme | `DemoPreferencesProvider` React context | Survives client navigation; resets on refresh |
| Unsaved settings draft | `SettingsForm` | Until leaving the settings route |
| Search, path filter, practice filters | Feature component state | Until leaving that route |
| Unsaved quiz option/written/code draft | Question component | Until changing question or leaving |
| Committed answer/feedback | Supabase attempt, restored through an owner-scoped DTO using a sessionStorage UUID | Durable history; same-tab restore survives refresh |
| Multiple-choice visit totals | `PracticeWorkspace` | Until reset, leaving the route, or refresh |
| Lesson bookmark/completion | Supabase `lesson_progress` | Persists across refresh/logout/login |
| Dashboard/progress/history | Shared server projection of owned saved records | Loaded per request and invalidated after saves |

Only the provider shares temporary study state; it has no browser-storage or database persistence. Authentication separately persists in HttpOnly cookies. Lesson/practice history is persisted separately through authenticated server adapters; temporary preferences remain separate from durable learning activity.

Account forms validate names and email on the server and save through Supabase Auth. Saved names update the greeting; email changes remain pending until confirmation. Career-path changes from Settings and Career Paths use the same actor-only server action and persist across visits. Remaining study settings apply for the current visit and reject invalid study minutes. Theme controls apply immediately through the provider, keeping Settings and the header synchronized. Time and explanation preferences are visibly labeled inputs for future capabilities.

## How practice works

`PracticeQuestion` is a discriminated union: the `kind` field selects one of three shapes. TypeScript knows that only a multiple-choice question has `options` and `correctOptionId`. This prevents accidental attempts to read those fields from a coding exercise.

For multiple choice:

1. The learner selects a native radio option. The client sends question slug, answer, and a random submission UUID to the same-origin Server Action.
2. The server verifies Auth and input, resolves the existing question/version UUID, grades using the server-only bank, and inserts an immutable finalized attempt.
3. Same-key/same-answer retries return the saved result; changed-answer reuse conflicts. Feedback is released only after the owned row is confirmed.
4. The form shows feedback and disables further submission. A deliberate new attempt gets a new UUID while retaining history.
5. The visit summary counts distinct questions checked during that visit. Dashboard/progress metrics count committed submissions, including intentional retakes.

Conceptual questions accept a draft and reveal a model answer for self-review. Coding exercises accept an optional draft and reveal an example solution. Neither is graded or executed. Skipping a question does not count as answering it. The progress bar in practice indicates the current position in the question set, not knowledge mastery.

## Mock data and adding content

Records link through stable string IDs. Topics are shared across career paths rather than duplicated. Lesson counts come from `lessons.ts`. The old `data/mock/progress.ts` fixture remains for structural validation only; runtime study pages use the shared account-specific read model. New runtime content needs permanent catalog/version identities through a separately reviewed migration; do not silently invent mappings or reuse version 1.

To add a topic:

1. Add a `Topic` record to `src/data/mock/curriculum.ts` with a unique kebab-case ID, description, category, difficulty, symbol, and accent.
2. Add its ID to appropriate career paths' `topicIds` arrays.
3. Update structural fixtures if needed by the validator; do not add fictional runtime progress. New learners start with genuine empty activity.
4. Add lessons and questions, or let the topic's existing empty state explain that lessons are still in development.

To add a lesson:

1. Add a `Lesson` record to `lessons.ts` with a unique ID and existing `topicId`.
2. Write objectives, substantive sections, a worked code example where relevant, and a takeaway. Code strings are displayed as text, never executed.
3. Add a factual reference and a multiple-choice `checkQuestionId` from the same topic.
4. Records appear in array order within the topic. Previous/next links and lesson counts update automatically.

To add a practice question:

1. Add a record in `questions.ts` with a unique ID, existing topic, prompt, difficulty, and explanation.
2. For `multiple-choice`, provide distinct choice IDs/text and exactly one matching correct ID. For `short-answer`, provide `modelAnswer`. For `coding`, provide language, example, and solution.
3. Review the explanation and example by hand. Run content validation and relevant tests.

Current examples cover Python variables, loops, lists, SQL SELECT, SQL JOIN, and Big O. Structural validation checks relationships and choice mappings; it does not certify correctness or replace the full publication review in the planning documents.

## Styling and accessibility

`globals.css` defines the semantic palettes documented in DESIGN_SYSTEM.md. Auth and study components reuse the same muted navy accent, spacing, surfaces, and system font. Charts have per-day text; tables have headers/captions; progress elements have accessible names. Forms retain native labels, autocomplete, validation, keyboard focus, status/error announcements, and reduced-motion support.

The shell uses a desktop sidebar from 768px upward and a native disclosure menu below it. Long code samples and the progress table scroll within their containers. Browser checks cover responsive layouts, keyboard controls, and automated accessibility; a full assistive-technology audit remains separate.

## Future integrations

Verified Supabase identity and free-practice persistence now exist. A future authorized slice must add reviewed publication, formal assignments, private assessment keys, atomic evidence/mastery grading, and the PRD mastery policy. Create migrations and generated database types rather than mapping frontend interfaces directly onto assumed tables.

AI calls will belong in guarded `src/server/ai/` adapters with grounded context and budget controls. They must not be added directly to Client Components. The Tutor, Practice, Assessment, and Planner boundaries in the architecture remain ordinary application capabilities. Executable Python/SQL and Monaco remain Phase 3 work, using a managed isolated runner outside the application and production database.

## Commands and verification

The browser command runs desktop, mobile, and tablet in separate Playwright invocations, each with a fresh local app/fixture. This prevents the complete 75-case run from consuming one shared localhost IP's ten-minute Auth budget. Production Auth limits remain unchanged; there is no test bypass in application code. Explicit `--project` selections are forwarded as one invocation. Browser-test artifacts are replaced per invocation; screenshots selected for the handoff are saved separately.

| Command | Purpose |
| --- | --- |
| `npm ci` | Reproduce installed dependencies from the existing lockfile |
| `npm run dev` | Start local Next.js development |
| `npm run check:study` | Redacted local study configuration check; no network |
| `npm run typecheck` | Strict TypeScript checks |
| `npm run lint` | ESLint |
| `npm run test:content` | Structural sample-content validation |
| `npm test` | Deterministic unit/security-boundary checks |
| `npm run test:e2e -- --workers=2` | Synthetic local browser regression suite; use installed Edge with `PLAYWRIGHT_CHANNEL=msedge` |
| `npm run build` | Production build; use `NEXT_DIST_DIR=.next/e2e` in the shell to isolate it from a running primary dev server |
| `npm start` | Serve the corresponding completed build |

The configured TypeScript, lint, unit, build, and browser checks are available with installed dependencies. Auth unit tests cover schemas, safe redirects/origins, cookie settings, limits, actions, proxy refresh, and callback failures. Browser auth checks use only the local synthetic fixture; passing them does not establish hosted email delivery or production configuration.

Browser tests cover selection/filtering, lesson navigation, correct and incorrect quiz feedback, self-review, display-only code, preferences, empty/unknown routes, responsive overflow, navigation, and automated accessibility. Test files are present; their existence is not evidence of a passing run.

## Troubleshooting

- **`node` or `npm` not found:** install the pinned Node version, ensure its directory is on PATH, and reopen the terminal. This session found Node under `C:\Program Files\nodejs`.
- **Registry `EACCES`, `ENOTCACHED`, or download errors:** allow the needed network access or install in a network-enabled environment. Offline installation works only when every required package is already cached.
- **`next`, `eslint`, `tsc`, or `vitest` not recognized:** dependencies are not installed successfully. Finish `npm install`; do not assume application code is responsible for this error.
- **Unsupported engine:** match the Node and npm versions in `package.json`. This project intentionally uses one package manager.
- **Port 3000 is occupied:** run `npm run dev -- --port 3001` and set `APP_URL=http://localhost:3001`. E2E uses separate ports 3100/54329 and a separate build cache.
- **A topic has no lessons:** this is an intentional empty state. Add content in `lessons.ts` and link it to the correct topic ID.
- **Preferences disappeared:** temporary state resets on refresh and full-page navigation. Use app links to preserve it within a visit.
- **Quiz totals do not match the dashboard:** visit totals count distinct questions checked in this visit; dashboard totals count saved submissions across visits, including intentional retakes.
- **Study progress is unavailable:** run `npm run check:study`; the current diagnosed blocker is a missing server secret key. After correcting configuration, restart Next.js. If format checks pass, inspect the fixed server stage/code and verify the same-project catalog/grants in a disposable environment; do not rerun migrations or relax RLS.
- **Browser cannot connect to localhost:** ensure the terminal running `npm run dev` is still active and use its printed URL. Connection refusal means the server/port is unavailable; it differs from an authenticated progress error.
- **Cannot execute a coding solution:** execution is deliberately absent. The text area is a draft editor only.

Next configure the missing primary server key and verify the application flow with separate disposable hosted accounts. Password recovery, deletion, reviewed publication, and mastery remain separate work; Step 3 and the Phase 1 release gate are not complete.
