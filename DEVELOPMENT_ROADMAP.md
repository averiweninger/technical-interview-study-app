# Development roadmap

Status: proposed full-product roadmap, 2026-10-21. The frontend foundation, design system, Step 3A connection utilities, and Step 3B email/password authentication flow exist. Step 3B includes cookie session refresh, server-side route checks, logout, and email confirmation; hosted email delivery and dashboard configuration still require verification. This is partial foundation work, not completion of Step 3, P1-A, or a Phase 1 exit gate. The user reports Step 3C migration/audit/two-user isolation/fingerprint checks passed. Step 3D implements persistent lesson activity, immutable server-graded practice history, and shared account-specific progress displays using existing grants. Hosted validation requires the correct server-only key and dedicated accounts. Password recovery is implemented locally with hosted recovery checks pending. Independent mastery evidence, AI, the reviewed launch bank, and deployment remain unimplemented. Later phases remain deferred. See README.md and DEVELOPER_GUIDE.md for setup and verification.

## Delivery strategy and implementation sequence

### Career-path selection follow-up

2026-10-22 stabilization: tightened bookmark read-back confirmation and added retry/completion and cross-path progress-preservation regressions. Primary configuration now passes local format checks; the separate isolation target has public configuration only, with no disposable server key or dedicated account credentials available. Hosted application verification remains pending. See the current report at the start of DEVELOPER_GUIDE.md; historical missing-key findings below are not the current configuration result.

Validation: 90 unit tests, 81 local browser cases, lint, TypeScript, content checks, and production build passed. Actual hosted preference verification remains a user smoke check; local tests use synthetic accounts only.

Implemented a durable, verified-owner primary path in existing Auth metadata, workspace revalidation, path-specific dashboard recommendations/topics, and saved-path defaults for the library/practice. Preserved shared completion/history and explicit all-topic browsing. No schema or remote migration is required. Multi-path selection, optional interview date, and remaining onboarding preferences are still separate work.

### Step 3D implementation handoff

2026-10-22 follow-up: diagnosed the local dashboard setup failure as `server_key_missing` using a redacted, network-free `check:study` command. Added safe server diagnostics, placeholder validation, workflow-restricted practice restore, and pagination that continues below provider row caps and rejects repeated rows. Hosted validation remains blocked on the user configuring the same primary-project server secret and a separate disposable test environment. No environment files or remote schemas were edited.

| Slice | Implemented in source | Remaining gate |
| --- | --- | --- |
| 1. Lessons | Verified-owner bootstrap, stable IDs, saved start/bookmark/resume/completion and retry-safe updates | Hosted smoke test with the correct server key; no new migration |
| 2. Practice history | Server-only keys/grading, safe DTOs, immutable atomic attempt inserts, canonical hashes, concurrent unique-key retries, account-scoped restore, ungraded saved drafts | Hosted concurrency/constraint checks; reviewed immutable content and formal assessment assignment remain separate work |
| 3. Progress UI | Shared account summaries, compact dashboard topics, real completion/average scores, recent updates, UTC submission chart, honest empty/error states | Larger hosted histories; summaries fail safely at 10,000 rows per source |
| 4. Security/reliability | Fresh verified Auth, same-origin actions, private server client, owner filters/DTO validation, write limits, no raw learner attempt access or client-selected grades/owners | Distributed production limits and broader release checks remain required |
| 5. Validation/docs | Focused unit/browser/content checks and separate primary/test configuration instructions | Hosted application evidence remains pending; local fixtures are not production verification |

Local follow-up results (2026-10-22): 85 unit tests, 75 browser cases (25 per viewport with fresh test servers), structural content validation, lint, TypeScript, and production build passed. The missing primary server key and disposable hosted application/concurrency checks remain open; these local results do not complete the full Phase 1 gate.

No remote migrations or real-account mutations were performed. Free-practice records set `evidence_eligible = false`; there is no mastery recomputation, evidence event ledger, scheduled review, study-time tracking, or streak calculation. Do not enable mastery from these previously public sample keys. Next: validate this application flow with disposable hosted accounts, then prepare the reviewed content/evidence transaction slice before claiming full QUIZ-01/PROG-01.

Keep one Next.js application, one Supabase project per environment, and the three module boundaries in [ARCHITECTURE.md](ARCHITECTURE.md). Reuse the functioning frontend and shared curriculum. Steps 1–2 refer to the existing planning/frontend foundation; verify affected setup and checks for each implementation task.

The requested Steps 3–9 below replace the earlier task order. Phase 1 covers Steps 3–4, Phase 2 covers Steps 5–7, and Phase 3 covers Steps 8–9. Moving the tutor to Step 6 is an intentional change from the original Phase 1 scope, so research/AI accounting can be established first. Foundational learning remains usable without either provider. Every step is planned, requires appropriate implementation authorization, and has focused tests; Step 9 adds final release hardening rather than postponing testing.

| Step | Deliverable | Dependencies and gate |
| --- | --- | --- |
| **3. Supabase authentication and persistent progress** | Verified email/password auth, owner-scoped preferences/goals, lesson activity, atomic quiz results/mastery, dashboard/history, and deletion for a minimal reviewed slice | Verify frontend setup; approved development Supabase configuration. Seed only enough catalog/private-key structure for one safe topic. Pass two-user/anonymous isolation, replay/concurrency, key privacy, persistence, and deletion checks before expansion. |
| **4. Structured curriculum and validated question bank** | Stable shared topic/skill IDs, six path mappings, reviewed immutable lessons/questions, publication validation, full foundational coverage | Step 3 persisted slice. Meet PRD coverage, source/key/explanation review, prerequisite checks, and no duplicate content/evidence across paths. |
| **5. Job-specific interview research and preparation profiles** | Company/job/date inputs, replaceable server search adapter, evidence evaluation/citations, draft-to-confirmed profile versions and shared topic/skill mappings | Step 4 catalog; approved search/AI access and numeric budgets. Establish accounting before synthesis. Pass evidence-class/citation, unsafe URL/injection, empty/partial/stale/conflicting result, ownership, refresh, cost/concurrency, and deletion checks; retain manual/path fallback. |
| **6. AI tutor grounded in curriculum and research** | Text tutor with explanation levels, bounded history, published lesson grounding, optional confirmed research context, streaming/failure controls | Step 5 adapter/budget/profile foundation; relevant provider evaluation gate. Preserve evidence labels/citations and hint policy; work from curriculum when research is absent. |
| **7. Adaptive learning and spaced repetition** | Reviewed diagnostics, deterministic plans combining prerequisites/profile/mastery/capacity, adaptive difficulty, due reviews, and transparent trends | Steps 4–6 plus adequate reviewed bank. Pass capacity/prerequisite, deduplication, sparse-evidence, timezone/DST, explicit replan/version, and assisted-work checks. |
| **8. Secure coding exercises and mock assessments** | Managed isolated Python/SQL execution, Monaco, trusted grading, server-timed mocks, text simulations/reports | Step 7; separately approved runner access/budget and isolation proof of concept. Pass runner/callback/deadline/hidden-test security gates before enabling execution. |
| **9. Testing and deployment** | Cross-system regression/evaluation, accessibility/mobile review, staging restore/deletion drills, provider kill switches, operational/privacy documentation, authorized rollout | Prior step gates; verified external configurations and explicit deployment authorization. Record real outcomes and remaining limits; planning or code approval alone never authorizes production deployment. |

## Security gates for every phase

Apply the permanent [AGENTS.md security baseline](AGENTS.md#application-security-baseline) and the existing [architecture boundaries](ARCHITECTURE.md) during each authorized implementation slice. Security checks accompany development; Step 9 does not defer them. These requirements do not authorize new features, services, or production testing.

| Phase | Required security evidence before its exit gate |
| --- | --- |
| **1 / Steps 3–4** | Verified Supabase server authorization; secure session refresh/logout, cookies, confirmation and redirect handling; server input validation; endpoint authorization and abuse limits. Verify least-privilege grants/RLS on all user-owned or exposed tables, private-key protection, and two-user/anonymous isolation through direct APIs/RPCs. Exercise XSS, applicable CSRF, and SQL-injection defenses. |
| **2 / Steps 5–7** | Extend the Phase 1 checks to research, conversations, plans, and derived data. Test untrusted content/prompt injection, safe rendering and retrieval, cross-user access, server-only AI/search calls, usage/rate limits, concurrent budget reservations, and provider failure. |
| **3 / Steps 8–9** | Prove submitted code runs only in managed disposable isolation, without production credentials or connectivity; test signed callbacks, hidden-test privacy, resource limits, and cross-user job access. Rerun relevant prior security gates and verify HTTPS, cookies, security headers, and private-response caching in staging before deployment. |

At each phase gate and dependency change, review dependency vulnerability reports, address exploitable findings, and record actual security check outcomes. Before any production release, document remaining vulnerabilities, untested boundaries, provider/retention limitations, and required Supabase/hosting settings in the existing operational documentation. Unresolved critical authorization, data-isolation, or execution-isolation failures block release; do not present planned protections as functioning controls.

## Phase 1: functional MVP

Steps 3–4 deliver the first persistent learning MVP: a small reviewed curriculum, deterministic single-choice grading, explainable topic evidence, history, and a rule-based next action. The reviewed text tutor now follows in Step 6. Product acceptance criteria and content minimums live in PRD.md, not a second feature specification here.

| Package | Specific tasks | Depends on | Acceptance and verification |
| --- | --- | --- | --- |
| P1-A Persistent slice / Step 3 | Auth, minimum catalog/key structure, lesson/quiz/progress persistence, owner-safe dashboard/history | Authorized dev setup and reviewed seed slice | Type/lint/build and auth/RLS/transaction checks; no production data in tests |
| P1-B Curriculum / Step 4 | Complete shared curriculum/skill catalog, six path mappings, validated imports and publication review | P1-A; content review time | PRD content minimum and provenance; immutable versions; no exposed private keys |
| P1-C Product completion | Settings/deletion, next-action rules, activity/evidence labels, responsive/accessibility and recovery states | P1-A/B | End-to-end learner loop, fully populated synthetic deletion, keyboard/mobile review; release rollout remains Step 9 |

Phase 1 exit criteria:

- All Phase 1 PRD requirements pass, including the entire learner loop with persisted data.
- Six paths are selectable, every path has at least four relevant mapped topics, and minimum reviewed content coverage is met. Coverage is accurately described as foundational.
- No answer key/private explanation appears in pre-submission responses, client bundles, source maps exposed by the deployment, or the browser-accessible database API. All sensitive server modules have appropriate boundaries.
- Same-payload retries return the prior result; different-payload reuse returns conflict. Parallel grading tests show no duplicate evidence; provider budget tests join the gate when introduced in Step 5.
- Two-user isolation passes at UI, Route Handler, Data API, RPC, and safe-view layers. Learners cannot edit authoritative scores, assistance status, model budgets, or content publication.
- No research/AI dependency in the foundational learner loop; their evaluation and budget gates apply when introduced in Steps 5–6.
- Responsive, accessibility, and performance checks meet the PRD beta targets, or measured exceptions are explicitly reviewed before widening access.
- Development/preview use synthetic records; secrets stay outside Git. Verify current auth email/callback configuration; later provider and production readiness remain Step 5–9 gates.
- Account deletion covers the current owned graph. Later steps extend it for research/conversations/jobs and in-flight reconciliation before enabling those features. Rollout/restore readiness is rechecked in Step 9.

## Phase 2: adaptive learning

Steps 5–7 introduce the Interview Research and Personalization Engines plus the tutor. Use bounded request-driven research and relational retrieval; avoid a crawler, autonomous agent, or vector store. Reuse Phase 1 grading/evidence. In-app reviews need no notification service or always-running worker.

| Package | Specific tasks | Depends on | Acceptance and verification |
| --- | --- | --- | --- |
| P2-A Research/profiles / Step 5 | Input snapshots, provider evaluation/adapter, search budget ledger, AI synthesis adapter/accounting, dated evidence/citations, confirmed profile mappings and deletion | Step 4; approved provider access and budgets | RESEARCH-01/PROFILE-01/JOB-01; no fabricated citations, cross-user reads, unsafe retrieval, or automatic activation |
| P2-B Tutor / Step 6 | Grounded streaming tutor, owned history, explanation styles, hint policy, optional research references, usage reconciliation and kill switch | P2-A foundation; actual model access | TUTOR-01; mocked refusal/incomplete/429/timeout/disconnect/replay; concurrent budget tests; at least 30 reviewed content and 20 adversarial cases, >=90% acceptable content and zero authorization/key violations |
| P2-C Diagnostics / Step 7 | Versioned assignments, resume/finalize once, evidence limits | P2-A/B; adequate reviewed bank | DIAG-01; no fabricated wrong answers for unfinished work |
| P2-D Planner / Step 7 | Capacity inputs, prerequisite ordering, confirmed-profile relevance, versioned feasible plans and explicit replanning | P2-C; curriculum estimates; optional P2-A profile | PLAN-01; no overloaded days, duplicate topic work, or silent changes on research refresh |
| P2-E Adaptation/reviews / Step 7 | Difficulty bands, due queue, bounded workload, atomic review transitions | P2-C/D; expanded bank | ADAPT-01/REVIEW-01; replay, DST, retired items, and assisted-evidence checks |
| P2-F Analytics/drafts | Trends, plan adherence, optional offline AI drafts behind publication review | P2-C/E; enough evidence | ANALYTICS-01; totals reconcile and low samples remain visible; no automatic question publication |

Phase 2 exit: the learner can review a cited job profile, request grounded help, diagnose gaps, accept a feasible plan, practice/review, and understand changes with evidence. Cover no date/capacity, sparse or conflicting research, unsupported skills, provider outage, profile edits/deletion, stale refresh, multiple paths, timezone changes, and idempotent reviews/replanning. Test research -> confirm -> tutor -> diagnose -> plan -> practice -> review -> explicit replan, including the no-research fallback. Rerun relevant source-attribution/injection and AI evaluations within approved cost caps.

## Phase 3: advanced interview preparation

Step 8 adds one supported Python runtime, read-only PostgreSQL over disposable synthetic fixtures, reviewed timed mock blueprints, and text-only simulations. Use a managed runner adapter/status polling; defer arbitrary languages/packages, multi-file projects, collaboration, voice/video, proctoring, and enterprise reporting. Step 9 then performs final cross-system validation, operational readiness, and separately authorized deployment.

| Package | Specific tasks | Depends on | Acceptance and verification |
| --- | --- | --- | --- |
| P3-A Runner selection and threat model | Evaluate managed isolation providers; verify network/filesystem/credential boundaries, resource limits, trusted harness, job idempotency, callbacks, retention, pricing, and regional needs; build a non-production proof of concept | Step 7 stable; approved provider access/budget | Document every isolation requirement/failure mode; disposable reference/adversarial workloads pass before enabling execution |
| P3-B Python practice | Lazy-load Monaco; add reviewed exercise configs/tests; durable execution ledger/dispatch; signed callbacks and reconciliation; safe result DTOs; trusted grading; source expiry and quotas | P3-A; content/test review | Tests cover infinite loops, memory/output/process abuse, egress, filesystem access, secret probing, learner-output forgery, duplicate/out-of-order callbacks, dispatch crash, timeout, and concurrency limits |
| P3-C SQL practice | Add disposable separate PostgreSQL fixtures, least-privilege read-only roles, AST/statement limits, resource controls, typed result comparison, alternative hidden datasets | P3-A/B adapter; SQL grading specification | No production connectivity; destructive/multi-statement/admin/file/network queries denied; NULL/duplicates/order/numeric cases grade correctly; environment discarded after every job |
| P3-D Timed mocks | Curated versioned blueprints/items; server start/deadline, autosave/reconnect, execution-aware submission, protected feedback, final report; dedicated assessment-only item pool | P3-B/C; Phase 2 assessment schema and sufficient unseen content | Browser clock changes cannot extend time; concurrent expiry/submission resolves deterministically; practice/tutor routes cannot disclose assessment-only keys; results finalize once despite runner delays |
| P3-E Text simulations and reports | Orchestrator-controlled interview turns, reviewed qualitative rubric, bounded context/usage, explicit AI-feedback labels; topic coverage/error trend/mock reports and safe export | P3-D; evaluated prompts and consent/retention flow | AI feedback cannot overwrite deterministic grades; injection/refusal/unsupported claims tested; report totals reconcile; exports omit hidden tests, raw job text, and unrelated identifiers |
| P3-F Release / Step 9 | Cross-system regression/evaluations, staging deployment, access/email/provider configuration checks, backups/restore, complete deletion drills, privacy/operations and kill switches | P3-A through P3-E gates and explicit rollout authorization | Record measured results and unresolved limits; approve production separately; application rollback does not undo database migrations |

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
| Research | Mocked search adapters; source authority/role/date evaluation; snippet/duplicate/conflict handling; fabricated citation rejection; evidence-class preservation; owner/run lineage; URL controls; refresh/confirmation/deletion and search-budget concurrency |
| Manual/operational | Keyboard/screen reader, responsive layouts, performance with representative data/network, backup/restore, provider outage and cost/execution kill switches |

Per implementation PR: scope and acceptance IDs; update docs if behavior/schema changes; run relevant focused checks plus configured lint/typecheck/build and required integration suites; inspect the result. CI uses no production credentials and no paid model calls by default. Use migrations in a clean local database, then non-production staging, before authorized production rollout. Report commands and actual outcomes; an unrun test is not a passing test. Database changes use additive/backward-compatible rollout where possible and a forward-fix/recovery plan where reversal could lose data. Do not assume an application rollback reverses a database migration.

## Risks and external dependencies

Owner for these actions is the solo developer, supported by Codex; account/budget decisions belong to the user. Priority is based on whether the risk blocks a phase release.

| Risk / phase | Consequence | Mitigation / dependency / gate |
| --- | --- | --- |
| Sparse or incorrect curriculum / 1 | Six path labels imply more value than content provides | Publish minimum reviewed coverage and sources; communicate foundational scope; content review is on the critical path |
| Secret or RLS/grant mistakes / 1 | Cross-user data/key disclosure or grade tampering | Server-only modules; private schema; explicit safe DTOs; two-user Data API/RPC tests; runtime role review |
| AI hallucination or answer leakage / 1-3 | Misleading instruction or invalid assessments | Grounded tutor, hint policy, reviewed bank, separate subjective feedback, evaluation gates, assessment-only pool |
| Uncontrolled provider spend / 2 | Search or AI cost exceeds budget | Actual account access, configured search/AI caps, atomic reservations, bounded retries, unknown-usage reconciliation, kill switches |
| Race conditions and replay / 1-3 | Duplicate grades/reviews/charges or inconsistent plans | Idempotency keys with input hashes, unique constraints, row/advisory locks, transaction/concurrency tests |
| Uncalibrated mastery / 1-2 | Learner overestimates readiness | Transparent heuristic, evidence counts, distinct-question/day requirements, assisted exclusion, independent validation before stronger claims |
| Email and redirect configuration / 1 | Learners cannot confirm/reset or are redirected unsafely | Supabase account access, custom SMTP for production, allowlists, staging delivery and callback checks |
| Provider/model/framework change / 1-3 | Broken SDKs, changed prices or runtime assumptions | Pin versions; provider adapter; verify official docs/model access/prices during implementation; rerun evaluations on changes |
| Unrealistic schedule / 2 | Deadline pressure produces unusable plans | Hard daily capacity, prerequisite graph validation, explicit shortfall, editable inputs and completed-item preservation |
| External research/privacy / 2 | Injection, unsafe retrieval, false authority, or unnecessary retention | Consent/minimized queries, bounded provider-mediated retrieval, PRD evidence classes, citation/excerpt checks, owner isolation, confirmed mappings, and derived-data deletion |
| Sparse/stale/conflicting research / 2 | Misleading company-specific preparation | Dated profile versions, source context, deduplicated evidence, explicit predictions/coverage gaps, manual/path fallback, no silent replanning |
| Sandbox or grader escape / 3 | Infrastructure compromise, cross-user access, false grades | Managed disposable isolation, separate network/account, no secrets/egress, trusted external harness; security proof of concept blocks release |
| Async delivery failure / 3 | Stuck jobs or duplicate finalization | Durable job ledger, provider idempotency/lookup, signed callbacks, leases, reconciliation, monotonic state machine |
| Mock item exposure / 3 | Prior practice reveals assessment answers | Dedicated assessment-only visibility; all hint/solution/read endpoints enforce run policy; do not present mocks as proctored hiring assessments |
| Retention/deletion/backup mismatch / 1-3 | Removed content reappears or misleading privacy promise | Document actual app/provider/backup retention; cancellation/reconciliation and resumable deletion; restore deletion tombstones |
| Plan/vendor cost and regional limits / 1-3 | Unexpected deployment limits or latency | Verify Vercel/Supabase plans, regions, backups, limits and billing before release; keep execution out of app functions |
| Solo-developer scope growth / all | Slow launch and hard-to-maintain infrastructure | Enforce phase exclusions; reviewable slices; delay extra agents, queues, vector search, languages, and content UI until justified |

Provider/account prerequisites by phase:

- Steps 3–4: verified frontend runtime/lockfile, development Supabase tooling/project and auth email/callback configuration, reviewed content and stable catalog IDs. No search/AI/runner provider is required for the foundational loop.
- Steps 5–7: approved web-search/AI provider access, verified retrieval capabilities/terms, numeric search/AI budgets, evidence evaluation fixtures, broader reviewed bank, curriculum duration/prerequisite data, and learner capacity inputs. No agent service is required.
- Phase 3: managed isolated runner account and reviewed capabilities, reliable job dispatcher/scheduler, trusted grading harness, synthetic SQL datasets, runtime/artifact versioning, and a separate security/cost gate.
- Step 9: authorized Vercel/Supabase environments, production email/redirect configuration, backups/restore capability, monitoring, provider retention review, and explicit deployment approval. None is provisioned by this documentation update.

## Planning handoff

This update changes only [PRD.md](PRD.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md), this roadmap, and [AGENTS.md](AGENTS.md). Review document consistency/links and stop. Source changes, dependency installation, application tests, provider calls, provisioning, and deployment require a later authorized task; do not commit or push automatically.
