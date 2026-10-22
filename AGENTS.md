# Instructions for future Codex sessions

## Current project state and authorization

This repository contains the frontend prototype, Supabase connection utilities (Step 3A), and email/password authentication (Step 3B). The user explicitly authorized these small slices after the initial planning handoff. Step 3C migration/audit/isolation success is user-reported. Step 3D adds server-side lesson bookmarks/completion, immutable practice submissions with server grading, and account-specific dashboard/history summaries using existing tables. Browser payloads exclude answer keys. Practice on this previously public sample bank is not mastery evidence; no mastery projection is written. Multiple selected career paths and exactly one selected primary are saved together in validated Auth metadata; the primary drives dashboard recommendations and default study/practice filters. New signups complete resumable /onboarding setup; established accounts without the onboarding version marker are not forced to repeat it. Hosted path/onboarding checks remain pending; daily goal, explanation level, theme, timezone, and an optional calendar interview date are also saved in validated Auth metadata. Metadata remains preference data, never authorization; hosted preference verification remains pending. Hosted application validation still requires the correct server-only key and a separate test environment. OpenAI, executable practice, deployment, and further backend features remain outside this authorization. Do not report the complete Phase 1 MVP as implemented.

Initial dependency installation was blocked; a later frontend inspection found installed dependencies and an npm lockfile. Verify current tooling and actual check results for each task rather than carrying forward historical setup blockers. The earlier public-answer/browser-grading prototype exception is historical. Runtime answer keys and grading are now server-only. Previously public sample keys remain unsuitable for secure assessments or mastery; reviewed immutable content and the evidence transaction pipeline are still required.

**Wait for the user's approval before beginning Phase 1 implementation.** This is the user's explicit instruction for the planning handoff, not a requirement to ask again on every task. Once the user authorizes Phase 1 or a particular action, proceed within that authorization without redundant approval questions. Later explicit user instructions take precedence over this file. Do not assume authorization to provision paid services, deploy to production, or start later phases from approval of a code change alone.

Before changing anything, read the applicable repository instructions, inspect `git status`, and review the task context. Inspect only the files/dependencies needed for the authorized work. Documentation-only tasks normally require no source inspection or application tests. Preserve unrelated user changes; the initial empty-repository observation is historical.

Read the relevant planning documents:

- [PRD.md](PRD.md): product requirements, acceptance IDs, exact MVP scope, evidence policy.
- [ARCHITECTURE.md](ARCHITECTURE.md): stack, folder structure, use cases/APIs, AI and execution boundaries.
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md): table definitions, constraints, ownership, grants/RLS, transaction requirements.
- [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md): ordered tasks, phase gates, risks and external dependencies.

These documents are proposed designs. If implementation reveals an issue, explain the tradeoff, choose the simplest reliable correction within the authorized scope, and update the affected documents. Do not let an obsolete design silently govern production behavior.

## Stack and scope

Use Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase PostgreSQL/Auth, server-side OpenAI API, Vercel, and GitHub. Add Monaco and a managed isolated Python/SQL runner only in Phase 3. Choose supported versions at scaffolding time, pin the runtime/package manager and lockfile, and check current official documentation for version-sensitive APIs. Do not assume any tool or dependency exists merely because it appears in a plan.

Follow the Step 3–9 sequence in DEVELOPMENT_ROADMAP.md. Phase 1 (Steps 3–4) is auth, persistent progress, path selection/optional interview date, reviewed library/lessons/quizzes, settings, and deletion. Minimum content remains eight topics/eight lessons/forty questions and six selectable paths with shared foundations. Phase 2 (Steps 5–7) adds interview research/preparation profiles, grounded tutor, diagnostics, adaptive plans, and reviews. Phase 3 (Steps 8–9) adds isolated execution/mocks and final release verification. Testing accompanies every implemented step; Step 9 is release hardening. These are plans, not authorization to implement or provision services.

Keep one modular application and a deterministic learning orchestrator. Tutor/Practice/Assessment/Planner are capability boundaries, not a mandate for autonomous agents, separate deployments, or an agent framework. Use ordinary logic for grading, eligibility, budgets, scheduling, selection, and access control. Use AI for bounded explanations and validated drafts/extractions. Avoid speculative abstractions and new infrastructure without evidence.

## Permanent development rules

- Write simple, readable, well-commented code; explain important functions and non-obvious logic without narrating every line.
- Reuse existing components and shared curriculum data. Career paths and preparation profiles reference stable topic/skill IDs; never duplicate lessons for a company or job.
- Avoid unnecessary dependencies, abstractions, services, and state-management layers. Follow the documented architecture and explain any necessary correction.
- Preserve functioning features and unrelated user work. Make minimal, targeted changes; do not modify unrelated files.
- Keep Codex responses concise to conserve tokens. Read relevant document sections and affected files; avoid repeatedly analyzing the entire repository or performing broad scans without need.
- Do not automatically commit or push. Feature planning does not authorize implementation, external account setup, paid calls, or deployment.

## Application security baseline

- Validate all user-controlled inputs on the server, including IDs, URLs, uploaded/retrieved content, and provider callbacks. Authorize protected API endpoints and apply appropriate per-user/IP rate limits, request-size limits, and concurrency caps; public auth endpoints still need abuse protection.
- Use the official Supabase session flow. Refresh and verify sessions server-side; handle expiry, revocation, logout, and failures explicitly. Use Secure cookies over HTTPS, appropriate SameSite settings, and HttpOnly where compatible with the documented SSR flow. Allowlist callback origins and local redirect destinations; return safe authentication errors without leaking credentials or account existence.
- Require HTTPS and reviewed production security headers, including CSP, HSTS, frame restrictions, content-type protections, and a suitable referrer policy. Keep authenticated responses out of shared caches.
- Prevent XSS through safe rendering and sanitization of untrusted rich content; use parameterized database operations against SQL injection. Enforce same-origin/CSRF protection where cookie-authenticated mutations require it. Follow the AI rules below for prompt injection; a model cannot enforce authorization.
- Review dependency vulnerability reports when adding/updating packages and before release; remediate exploitable findings and document unresolved risks. Never treat a clean audit as proof of application security.
- Include relevant security checks in every implementation phase, especially two-user and anonymous access tests. Before production, document implemented controls, untested boundaries, remaining vulnerabilities, provider/retention limits, and required dashboard configuration. Planned controls are not implemented guarantees; unresolved critical access or isolation failures block release.

## Frontend design system

- Follow [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) and semantic tokens in `src/app/globals.css` for every frontend feature: warm off-white `#FAFAF8`, charcoal `#20252B`, muted navy `#315B75`, subtle borders `#E5E7EB`, white surfaces, and the documented dark equivalents.
- Use the system font stack, restrained type hierarchy, 8px-based layout spacing, small radii, and minimal shadows. Reuse existing shadcn/ui primitives; add no dependency or imagery for decoration.
- Choose layouts for the task: progress and a clear next action on dashboards, readable lesson columns, focused question forms, and labeled charts/tables. Avoid repetitive three-column card layouts and marketing copy.
- Keep hover, focus, active, disabled, loading, empty, error, and success states consistent. Provide visible keyboard focus, native semantics, readable contrast, at least 44px interactive targets, responsive layouts, and reduced-motion support. Do not encode status through color alone.
- Avoid gradients, glow, decorative orbs, glassmorphism, excessive badges/shadows, sparkle icons, oversized headings, and unnecessary animation. Preserve routes, behavior, demo labels, and existing content when styling.

## Interview research rules

- Preserve the Learning, Interview Research, and Personalization boundaries in ARCHITECTURE.md inside the same application. SQL and typed use cases are sufficient initially.
- Use a replaceable server-only web-search provider adapter. Treat company/job inputs, URLs, snippets, pages, and generated research as untrusted. Follow the bounded retrieval and URL controls in ARCHITECTURE.md; never grant a model arbitrary browsing or database tools.
- Apply the PRD evidence policy: distinguish official information, candidate-reported experiences, and AI predictions. Retain source URLs, research/retrieval dates, and claim-level citations. A prediction is never promoted to fact by model agreement or repetition.
- Keep user jobs, goals, research, mappings, and plans owner-scoped with RLS and composite ownership constraints. Shared company records contain trusted catalog metadata only; no automatic public sharing of personal research.
- Only confirmed profile mappings may affect job relevance. Research cannot publish curriculum, raise mastery, disclose protected answers, or silently replace an active plan. Missing evidence falls back to career-path preparation.

## Project structure and coding conventions

- Follow the recommended tree in ARCHITECTURE.md: thin `src/app` routes; reusable `src/components`; feature modules in `src/features`; sensitive use cases/DAL/learning/AI code in `src/server`; Supabase migrations and database tests in `supabase`; reviewed content in `content`; meaningful tests in `tests`.
- Default to Server Components. Add `use client` only at interactive boundaries. Put `server-only` guards on keys, private answer access, privileged data clients, and provider calls; never import those modules into a client graph.
- Use strict TypeScript. Prefer typed inputs/outputs and discriminated states over booleans that permit contradictory combinations. Validate untrusted runtime inputs with Zod or the chosen compatible schema library; do not use `any` to bypass boundary checks.
- Use `PascalCase` React components/types, `camelCase` functions/variables, consistent kebab-case module filenames where the framework does not impose a name, and SQL `snake_case` identifiers. Keep naming descriptive; comments explain reasons or invariants.
- Keep business rules in pure typed functions where practical. Use feature use cases to coordinate auth, data, rules, and AI. Centralize safe DTOs, provider adapters, and error codes instead of scattering direct SDK/database calls through UI components.
- Prefer one package manager, the checked-in lockfile, native platform features, and existing shared primitives. Add dependencies only for a real current requirement. Never maintain parallel lockfiles.
- Use Tailwind design tokens and accessible shadcn primitives consistently. Build loading/empty/error/success states alongside the feature. Validate forms on the server even when client validation exists. Do not put infrastructure details or raw provider errors into learner flows.
- Store instants in UTC and preserve the user's validated IANA timezone for local schedules. Distinguish a local interview date from a timestamp. Use fixed-precision money in persistence.
- Keep the platform employer-neutral and expandable through curriculum data. Do not introduce AT&T-specific copy, paths, scoring, or schemas.

## Database and security invariants

- Make schema changes through reviewed SQL migrations; generate database types after schema changes. Do not hand-edit generated types or make undocumented dashboard-only schema edits.
- Enable RLS on every user-owned or exposed table, with explicit least-privilege grants and appropriate owner policies. Test two users plus anonymous access. Enforce owner relationships with composite FKs where needed. Owner visibility does not authorize a learner to edit grades, assistance flags, publication, or quotas.
- Keep keys, hints before permitted release, hidden tests, reviews, and cost ledgers in a non-exposed private schema. Return explicit safe DTOs. Raw attempt/job/assessment reads must not bypass feedback-release policies.
- Use Supabase Auth with verified server-side identity and ownership checks inside every handler/action/RPC boundary. Route protection, UI checks, and unverified session contents are insufficient. Follow the current supported Supabase SSR verification flow.
- Never expose secret keys, passwords, or private user data through client bundles, logs, committed files, examples, snapshots, screenshots, or error responses. Return private data only to authorized users through safe DTOs; secret keys never use `NEXT_PUBLIC_`. Delegate password storage and verification to Supabase Auth. `.env.example` has placeholder values only; `.env.local` is ignored. No production credentials are created by development tasks.
- Restrict privileged Supabase clients to narrow server adapters with an explicitly verified actor. RLS bypass makes these especially sensitive. Restrict security-definer functions, fixed `search_path`, and execution grants; never accept an arbitrary user ID as authorization.
- Grade, finalize attempts, append evidence, and recompute mastery atomically. Use idempotency UUIDs plus canonical input hashes, unique constraints, and locks. Replay with a different payload is a conflict. Test concurrent requests, not just sequential retries.
- Published content and assessment assignments are immutable by version. Changes create reviewed new versions. Keep logical question identity/topic attribution stable once published; grade corrections append auditable events and rebuild projections.
- Follow the PRD mastery algorithm and evidence thresholds. Lesson completion, time spent, assisted answers, and AI prose feedback cannot raise objective mastery. Display unassessed/limited-evidence states honestly.
- Deletion requires fresh authentication, cancellation/reconciliation of in-flight work, removal of owned content, and a documented backup/provider-retention policy. Test deletion across the complete synthetic ownership graph.

## AI and execution rules

- Call OpenAI only server-side through the configured adapter. Check current official OpenAI documentation for relevant API/model behavior; choose model IDs/prices using actual account access and evaluations, not presumed names or stale prices.
- Enforce per-user calls/concurrency/input-output caps and a configured global monthly budget before provider calls. Atomically reserve a conservative maximum across user/global buckets, including bounded retries; reconcile once using usage metadata. Retain unknown-usage reservations until resolved. Never assume a provider alert is an application hard cap.
- Ground the tutor in authorized published curriculum, bounded owned history, and, when available, the learner's confirmed research profile with its evidence labels and citations. Treat all external content as untrusted. Models cannot change authorization, scores, budgets, or schedules. Do not supply hidden assessment keys or credentials.
- Use schema-constrained outputs for structured AI tasks and validate domain semantics. Handle refusals, incomplete output, provider errors, and interrupted streams explicitly. AI availability must not block lessons or deterministic quizzes.
- Generated questions remain drafts until schema/key/explanation/reference checks and human/developer review pass. A second model's agreement is not proof. Maintain curated evaluations for factuality, hints, injection, data isolation, and cost/latency; rerun relevant cases on model/prompt changes.
- Never execute untrusted Python/SQL in Next.js, Vercel app functions, the production database, Node VM, local shell, or application subprocesses. Monaco is only an editor. Phase 3 uses disposable managed isolation in a separate boundary with no production credentials/network path, strict resources, a trusted grading harness, and signed/replay-safe outcomes.
- Never trust learner stdout to report test success. Keep expected outputs/hidden suites outside the learner process where possible. Distinguish runner failures from wrong answers and freeze timed-assessment source before the server deadline.
- External jobs require durable dispatch, idempotent provider submission/lookup, monotonic state transitions, authenticated callbacks, and reconciliation. Fire-and-forget serverless work is not a reliable queue.

## Testing and validation

The repository initially has no runnable tests or commands. Create and document actual scripts during approved scaffolding; do not pretend the suggested commands below already exist. Proposed standard scripts are `dev`, `lint`, `typecheck`, `test`, `test:integration`, `test:e2e`, `test:content`, `eval:ai`, and `build`; their package-manager invocation follows the selected lockfile.

Use Vitest for meaningful deterministic logic, database/SQL tests for constraints/RLS/RPCs, and Playwright for critical learner flows. Keep the stack small. Tests should protect behavior/invariants, not reproduce implementation constants or snapshot every UI detail.

For implementation changes, run relevant focused tests and the configured lint/typecheck/build checks. Include migration/reset, RLS, and transaction tests for data/security changes; end-to-end checks for changed critical flows. Do not broaden/repeat successful checks without a new change, failure, or unresolved concern. Documentation-only changes need link/consistency/format review, not application tests that do not exist.

Required areas include deterministic grading/mastery; hint/solution eligibility; key privacy; two-user isolation through direct APIs/RPCs; idempotency payload conflicts and concurrency; budgets/provider failure; content validation; timezone/DST; deletion; and later review/assessment/runner state machines. Use synthetic records and non-production services. CI mocks AI by default; paid live evaluations are opt-in and capped. Never run destructive or adversarial workloads against production infrastructure.

For UI changes inspect representative desktop/mobile layouts, keyboard navigation, labels/focus, and loading/empty/error states. Automated accessibility checks complement manual review. Performance claims need measurements with a documented environment and dataset.

## Development workflow and documentation

1. Inspect the current repository and applicable instructions; map the task to PRD acceptance IDs and its phase. Respect existing authorization and preserve unrelated work.
2. Implement the smallest coherent reviewable slice. Keep migrations, content, types, UI, and server rules consistent. Avoid unrelated refactors or speculative future features.
3. Validate behavior and security boundaries with appropriate checks. Resolve failures caused by the change. Clearly state blocked or unrun checks and why; never fabricate passing tests, deployment status, or integrations.
4. Update the affected root documents when scope, schema, routes, rules, tradeoffs, or operations change. Add setup/run/verification instructions when real commands exist. Record decisions and limitations where a future developer will find them.
5. Review the diff for accidental secrets, generated clutter, unrelated changes, and mismatched docs. Summarize what changed, why, how it was verified, and any material remaining risk. Do not commit, push, provision services, deploy, or message others without the relevant user authorization.

Use concise PR descriptions led by the concrete problem and resulting behavior, with acceptance IDs and actual validation. Distinguish mock fixtures from real provider checks. For staged rollout document migration compatibility, recovery, feature flags/kill switches, and observable success criteria. Do not imply that rolling back frontend code rolls back the database.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
