# Development roadmap

Status: proposed, 2026-10-21. Repository inspection found only Git metadata, with no application, installed dependency manifest, tests, integrations, or commits. This planning task creates five Markdown documents only. No feature or integration is marked complete. Obtain user approval before starting Phase 1.

## Delivery strategy

Build one usable learning loop first, then add adaptation, then executable interview practice. Keep one Next.js application and one Supabase project per environment. The central learning orchestrator is a collection of typed use cases and deterministic rules; agent names describe capabilities, not four independently deployed workers.

Phase 1's exact product scope is in [PRD.md](PRD.md): email/password authentication, six selectable career paths, optional interview date, eight foundational topics with eight reviewed lessons and forty reviewed single-choice questions, a bounded text tutor, independent-performance estimates, basic history, and a dashboard. No diagnostics, generated roadmaps, job descriptions, review scheduler, code runner, Monaco, mocks, or interview simulation are in that release.

Task order below expresses dependencies rather than calendar promises. For a solo developer, finish one tested vertical slice before expanding the library. Infrastructure configuration, content authoring, and external account access can change duration; do not make delivery-date commitments without measuring the first slice.

## First five implementation tasks, after approval

These are the first five tasks in order; Phase 1 work packages below continue from them. Each should be independently reviewable.

| Task | Work | Dependencies | Completion evidence |
| --- | --- | --- | --- |
| 1. Establish the app foundation | Scaffold Next.js App Router/TypeScript, Tailwind, shadcn/ui; choose supported versions, pin Node/package manager and a lockfile; add layout/navigation tokens, strict typing, lint/format config, `.gitignore`, placeholder `.env.example`, and minimal CI | User approval of Phase 1 | Production build, typecheck, lint pass; basic shell works at mobile/desktop widths; no credentials or fabricated dashboard data presented as real |
| 2. Establish the data and security foundation | Configure local Supabase; migrate Phase 1 identity/catalog/version/key/review/goal/activity/mastery/AI tables in dependency order; add grants/RLS and safe grading/publication RPC skeletons; generate TS types; seed one reviewed topic/lesson and five quiz items | Task 1; local Supabase tooling (including its container runtime) or approved isolated dev project | Clean reset applies migrations/seeds; constraint and two-user RLS tests pass; raw answer keys are inaccessible; no Phase 2/3 runtime features enabled |
| 3. Complete authentication | Add signup, confirmation, login, logout, recovery/reset, callback allowlists, verified server identity, protected data-access helpers, and profile provisioning | Tasks 1-2; development Supabase Auth configuration | Two accounts can sign in/out/reset in a test environment; invalid/expired sessions fail safely; direct handlers/RPCs cannot impersonate another user; preview redirects verified |
| 4. Complete onboarding and library | Seed all six paths and mappings for the first topic; implement one-or-more selected paths with primary selection, optional interview date/timezone, editing, and published library/lesson display | Tasks 2-3; reviewed initial content | Selections/goal persist after reload; unpublished content stays hidden; lesson works by keyboard at 360px; empty/unassessed states are useful |
| 5. Complete one graded learning slice | Implement lesson resume/activity, owned quiz assignment, hint/solution exposure, deterministic submission, idempotent atomic mastery update, safe feedback, and a basic dashboard/history read for the first topic | Tasks 2-4; private answer-key RPC and PRD mastery rules | End-to-end signup -> onboarding -> lesson -> quiz -> feedback -> dashboard passes; duplicate/concurrent submit does not inflate evidence; lesson completion/assistance do not raise mastery; cross-user and key-disclosure tests pass |

The fifth task produces the first meaningful working slice. It is not the full Phase 1 beta; tutor, complete launch content, deletion, and release verification still follow.

## Phase 1: functional MVP

Simplest implementation that delivers value: a small reviewed curriculum, deterministic single-choice grading, explainable progress estimates, and one text tutor grounded in selected lessons. The learner can make progress without AI. Recommendations are rules, not a schedule.

| Package | Specific tasks | Depends on | Acceptance and verification |
| --- | --- | --- | --- |
| P1-A Foundation | Complete tasks 1-3 above; establish synthetic fixtures and CI artifact conventions | Planning approval; dev provider setup | Build/type/lint plus auth/RLS integration checks; no production database use in tests |
| P1-B Learning slice | Complete tasks 4-5 above; add content schema/import validation and publication review records | P1-A; reviewed seed slice | End-to-end learner loop; deterministic answer and mastery tests; replay/correction/ownership tests |
| P1-C Launch curriculum | Expand to eight topics, eight lessons, forty single-choice questions; map each path to at least four topics; validate prerequisites, sources, explanations, difficulty, and examples | P1-B; content review time | Every published version has a current approved review/key; seed coverage and reference checks pass; duplicates/ambiguous items resolved |
| P1-D Tutor and cost controls | Implement server-only Responses adapter, owned conversation history, topic/lesson grounding, style selection, streaming, hint policy, quotas, atomic cost reservations/reconciliation, cancellation and failure states; select model using evaluation fixtures | P1-A/B; actual API access and configured numeric monthly budget | Mocked integration tests cover success/refusal/incomplete/429/timeout/disconnect/replay; concurrent calls cannot overspend limits; at least 30 content plus 20 edge/adversarial cases evaluated; >=90% acceptable reviewed content and zero authorization/hidden-key violations on release set |
| P1-E Product completion | Dashboard/evidence labels, basic paginated history, next-action rules, settings, conversation deletion, fresh-auth account deletion, bounded study-session activity, responsive/accessibility polish | P1-B/C/D | Empty/error/loading/recovery states; deletion tested on fully populated synthetic account; keyboard/screen-reader checks; no mastery from activity |
| P1-F Beta readiness | Staging/production environment separation, SMTP and callback setup, CI/preview workflow, redacted monitoring, retention/purge process, backup/restore procedure, AI kill switch, performance checks, product/privacy explanation | P1-C/D/E; provider configurations | All launch gates below pass; deploy only within the user's authorized scope; record actual check results and remaining limitations |

Phase 1 exit criteria:

- All Phase 1 PRD requirements pass, including the entire learner loop with persisted data.
- Six paths are selectable, every path has at least four relevant mapped topics, and minimum reviewed content coverage is met. Coverage is accurately described as foundational.
- No answer key/private explanation appears in pre-submission responses, client bundles, source maps exposed by the deployment, or the browser-accessible database API. All sensitive server modules have appropriate boundaries.
- Same-payload retries return the prior result; different-payload reuse returns conflict. Parallel grading and budget tests show no duplicate evidence or quota bypass.
- Two-user isolation passes at UI, Route Handler, Data API, RPC, and safe-view layers. Learners cannot edit authoritative scores, assistance status, model budgets, or content publication.
- Model/prompt release evaluations pass; user/global budgets are configured and enforced. Core learning remains usable with AI disabled.
- Responsive, accessibility, and performance checks meet the PRD beta targets, or measured exceptions are explicitly reviewed before widening access.
- Preview/staging use synthetic records; production secrets are outside Git. Real email delivery, provider account access, backup capability, and configured runtime duration are verified, not assumed.
- Account/conversation deletion and retention processes work, including in-flight AI reconciliation and late-callback policy where applicable. Deployment rollback and database restore instructions have been exercised in non-production.

## Phase 2: adaptive learning

Simplest implementation that delivers value: reviewed diagnostic items, deterministic difficulty bands and capacity-aware schedules, a database-backed due-review list, and optional AI-assisted job-to-topic mapping that the learner confirms. Reuse Phase 1 attempts/grading and topic evidence. In-app review needs no notification service or always-running agent.

| Package | Specific tasks | Depends on | Acceptance and verification |
| --- | --- | --- | --- |
| P2-A Diagnostics | Add versioned assessment templates/runs/items; sample/freeze reviewed topic coverage; resume/finalize once; show confidence/evidence limits | Phase 1 stable; adequate reviewed bank per topic | Interrupted diagnostics resume; scores/feedback release correctly; cross-user/item-version mismatch rejected; incomplete work does not invent wrong answers |
| P2-B Goal inputs and job analysis | Add daily minutes/weekdays; paste-only job description consent/limits/deletion; constrained skill extraction; source excerpt validation; manual accept/reject mappings | P2-A data; tutor adapter/quotas reused | Empty/no-match/injection/malformed outputs handled; unsupported topics shown as coverage gaps; only confirmed mappings affect relevance; deleted text leaves no raw copies in plans/logs |
| P2-C Planner | Implement versioned scoring/prerequisite ordering, time estimates, capacity packing, explanations, goal-date handling, user overrides, and replan with completed work preserved | P2-A/B; curriculum estimates and dependency graph | No schedule exceeds daily capacity; no task precedes unmet required prerequisites; infeasible deadlines show unallocated work; replay/concurrency cannot create two active plans |
| P2-D Adaptive practice and reviews | Add score/evidence-based difficulty bands, review schedules/events, due queue, interval transitions, workload cap, and assisted-review rules | P2-A/C; expanded reviewed question coverage | Same attempt cannot advance twice; missed days carry forward; UTC/day boundaries and DST tested; retired questions handled; assisted work remains distinct |
| P2-E Analytics and draft tooling | Add topic/time-window trends, independent vs assisted comparisons, error categories, plan adherence, optional offline AI question drafts with validation/review; no auto-publication | P2-A/D; enough actual/synthetic historical evidence | Charts reconcile with authoritative attempts/events; low sample sizes visible; draft key/explanation and duplicate checks plus human approval block invalid publication |

Phase 2 exit: the learner can diagnose, review a feasible plan, practice at an appropriate difficulty, revisit due items, and understand changes with evidence. Boundary tests cover no interview date, past deadline, no available days, multiple paths, no matching job topics, sparse evidence, timezone changes, and idempotent review/replanning. Verify planner/review behavior with pure-function tests and database integration tests; use end-to-end tests for diagnose -> plan -> practice -> review -> replan. Job analysis and draft-generation releases rerun relevant AI evaluations within a defined cost cap.

## Phase 3: advanced interview preparation

Simplest implementation that delivers value: one supported Python runtime, read-only PostgreSQL queries over synthetic disposable fixtures, fixed reviewed timed mock blueprints, and text-only interview simulation. Use a managed runner adapter and status polling; defer arbitrary languages/packages, multi-file projects, collaborative editing, live voice/video, proctoring, and enterprise reporting.

| Package | Specific tasks | Depends on | Acceptance and verification |
| --- | --- | --- | --- |
| P3-A Runner selection and threat model | Evaluate managed isolation providers; verify network/filesystem/credential boundaries, resource limits, trusted harness, job idempotency, callbacks, retention, pricing, and regional needs; build a non-production proof of concept | Phase 2 stable; approved provider access/budget | Document evidence for every isolation requirement and failure mode; reference and malicious sample workloads pass; provider chosen only after gate review |
| P3-B Python practice | Lazy-load Monaco; add reviewed exercise configs/tests; durable execution ledger/dispatch; signed callbacks and reconciliation; safe result DTOs; trusted grading; source expiry and quotas | P3-A; content/test review | Tests cover infinite loops, memory/output/process abuse, egress, filesystem access, secret probing, learner-output forgery, duplicate/out-of-order callbacks, dispatch crash, timeout, and concurrency limits |
| P3-C SQL practice | Add disposable separate PostgreSQL fixtures, least-privilege read-only roles, AST/statement limits, resource controls, typed result comparison, alternative hidden datasets | P3-A/B adapter; SQL grading specification | No production connectivity; destructive/multi-statement/admin/file/network queries denied; NULL/duplicates/order/numeric cases grade correctly; environment discarded after every job |
| P3-D Timed mocks | Curated versioned blueprints/items; server start/deadline, autosave/reconnect, execution-aware submission, protected feedback, final report; dedicated assessment-only item pool | P3-B/C; Phase 2 assessment schema and sufficient unseen content | Browser clock changes cannot extend time; concurrent expiry/submission resolves deterministically; practice/tutor routes cannot disclose assessment-only keys; results finalize once despite runner delays |
| P3-E Text simulations and reports | Orchestrator-controlled interview turns, reviewed qualitative rubric, bounded context/usage, explicit AI-feedback labels; topic coverage/error trend/mock reports and safe export | P3-D; evaluated prompts and consent/retention flow | AI feedback cannot overwrite deterministic grades; injection/refusal/unsupported claims tested; report totals reconcile; exports omit hidden tests, raw job text, and unrelated identifiers |

Phase 3 exit: executable practice is isolated and recoverable; mocks are timed by the server; trusted grades are reproducible; simulation feedback is clearly distinguished from objective evidence. Run a separate security review of runner/network/grader boundaries and destructive tests only in disposable non-production environments. Never use the production application database as an SQL sandbox. Do not claim cheating prevention or infer a hiring-success probability from mock scores.

For executable mocks, define a clear cutoff before launch: response/source must be accepted before the server deadline; grading may finish afterward. Submission freezes the last accepted source. Jobs created after expiry cannot change it; grading infrastructure failures are retryable against that frozen source and do not count as learner errors. This avoids penalizing learners for runner queue delays while preserving an authoritative deadline.

## Testing and release workflow

Use an initially small test stack: Vitest for deterministic functions and component behavior where valuable; PostgreSQL/pgTAP or equivalent SQL integration tests for constraints/RLS/RPCs; Playwright for a few critical learner paths. Pick exact compatible versions during scaffolding. Do not introduce multiple overlapping test runners or test files that merely repeat implementation constants.

| Layer | Meaningful coverage |
| --- | --- |
| Unit | Grading, eligibility/weights/window, evidence labels, recommendation ordering, future schedule packing/review intervals, cost estimates, timezone conversion |
| Database/integration | Migration reset, version immutability, answer-key privacy, owner FKs, role/grant/RLS behavior, transactional replay/corrections, concurrent budget/grading, deletion |
| Application integration | Verified auth, input schemas, origin/CSRF checks, safe DTOs, SSE interrupted states, quota/provider failure, idempotency key/payload mismatch |
| End-to-end | Signup/onboarding/lesson/quiz/dashboard; session expiry; tutor fallback; two-user isolation; later diagnose/plan/review and editor/job/mock flows |
| Content and AI | Reviewed content schema/coverage/provenance; curated factual/hint cases; prompt-injection/refusal tests; separate opt-in bounded live evaluations |
| Manual/operational | Keyboard/screen reader, responsive layouts, performance with representative data/network, backup/restore, provider outage and cost/execution kill switches |

Per implementation PR: scope and acceptance IDs; update docs if behavior/schema changes; run relevant focused checks plus configured lint/typecheck/build and required integration suites; inspect the result. CI uses no production credentials and no paid model calls by default. Use migrations in a clean local database, then non-production staging, before authorized production rollout. Report commands and actual outcomes; an unrun test is not a passing test. Database changes use additive/backward-compatible rollout where possible and a forward-fix/recovery plan where reversal could lose data. Do not assume an application rollback reverses a database migration.

## Risks and external dependencies

Owner for these actions is the solo developer, supported by Codex; account/budget decisions belong to the user. Priority is based on whether the risk blocks a phase release.

| Risk / phase | Consequence | Mitigation / dependency / gate |
| --- | --- | --- |
| Sparse or incorrect curriculum / 1 | Six path labels imply more value than content provides | Publish minimum reviewed coverage and sources; communicate foundational scope; content review is on the critical path |
| Secret or RLS/grant mistakes / 1 | Cross-user data/key disclosure or grade tampering | Server-only modules; private schema; explicit safe DTOs; two-user Data API/RPC tests; runtime role review |
| AI hallucination or answer leakage / 1-3 | Misleading instruction or invalid assessments | Grounded tutor, hint policy, reviewed bank, separate subjective feedback, evaluation gates, assessment-only pool |
| Uncontrolled AI spend / 1 | Operating cost exceeds budget | Actual API access and numeric monthly budget required; atomic reservations, hard token/call/concurrency limits, conservative retries, kill switch |
| Race conditions and replay / 1-3 | Duplicate grades/reviews/charges or inconsistent plans | Idempotency keys with input hashes, unique constraints, row/advisory locks, transaction/concurrency tests |
| Uncalibrated mastery / 1-2 | Learner overestimates readiness | Transparent heuristic, evidence counts, distinct-question/day requirements, assisted exclusion, independent validation before stronger claims |
| Email and redirect configuration / 1 | Learners cannot confirm/reset or are redirected unsafely | Supabase account access, custom SMTP for production, allowlists, staging delivery and callback checks |
| Provider/model/framework change / 1-3 | Broken SDKs, changed prices or runtime assumptions | Pin versions; provider adapter; verify official docs/model access/prices during implementation; rerun evaluations on changes |
| Unrealistic schedule / 2 | Deadline pressure produces unusable plans | Hard daily capacity, prerequisite graph validation, explicit shortfall, editable inputs and completed-item preservation |
| Pasted job text/privacy / 2 | Injection or unnecessary retention | Paste-only input; consent and deletion/expiry; excerpt checks; manual mappings; no arbitrary tools or URL fetching |
| Sandbox or grader escape / 3 | Infrastructure compromise, cross-user access, false grades | Managed disposable isolation, separate network/account, no secrets/egress, trusted external harness; security proof of concept blocks release |
| Async delivery failure / 3 | Stuck jobs or duplicate finalization | Durable job ledger, provider idempotency/lookup, signed callbacks, leases, reconciliation, monotonic state machine |
| Mock item exposure / 3 | Prior practice reveals assessment answers | Dedicated assessment-only visibility; all hint/solution/read endpoints enforce run policy; do not present mocks as proctored hiring assessments |
| Retention/deletion/backup mismatch / 1-3 | Removed content reappears or misleading privacy promise | Document actual app/provider/backup retention; cancellation/reconciliation and resumable deletion; restore deletion tombstones |
| Plan/vendor cost and regional limits / 1-3 | Unexpected deployment limits or latency | Verify Vercel/Supabase plans, regions, backups, limits and billing before release; keep execution out of app functions |
| Solo-developer scope growth / all | Slow launch and hard-to-maintain infrastructure | Enforce phase exclusions; reviewable slices; delay extra agents, queues, vector search, languages, and content UI until justified |

Provider/account prerequisites by phase:

- Phase 1: GitHub repository/CI, supported Node/package manager, local Supabase tooling or isolated development project, Supabase project and email configuration, Vercel account/project, OpenAI API access/model availability and chosen spend cap. External setup is planned, not completed. Core lessons/quizzes can develop with synthetic data while paid tutor access is being configured.
- Phase 2: learner capacity inputs, a broader reviewed question bank, curriculum duration/prerequisite data, job-analysis prompt/evaluation fixtures. No additional AI-agent service is required.
- Phase 3: managed isolated runner account and reviewed capabilities, reliable job dispatcher/scheduler, trusted grading harness, synthetic SQL datasets, runtime/artifact versioning, and a separate security/cost gate.

## Planning handoff

Created plans are [PRD.md](PRD.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md), this roadmap, and [AGENTS.md](AGENTS.md). Stop after documentation consistency checks and a concise handoff. Wait for the user's approval before scaffolding, installing dependencies, provisioning services, or implementing Phase 1.
