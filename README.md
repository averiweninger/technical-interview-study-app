# Interview Compass

Interview Compass is an AI-powered adaptive learning platform in development, designed to help students and professionals prepare for technical interviews. The current application connects educational sample lessons, server-checked practice, and persistent account-specific progress displays. The long-term plan adds grounded AI tutoring and evidence-based personalization.

**Status:** Initial development stage with email/password signup, login, confirmation, logout, and protected study routes using Supabase SSR sessions (Step 3B). The user reports Step 3C database migration/security checks passed. Step 3D implements saved lesson progress, immutable practice history, and real dashboard/progress metrics; configure its server-only key using [the developer guide](DEVELOPER_GUIDE.md#step-3d-persistent-study-progress). Mastery is explicitly not assessed. Password recovery, OpenAI, code execution, and deployment are not implemented. Hosted email delivery and dashboard configuration require verification. This is not the complete Phase 1 MVP.

## Frontend Prototype

Signup stores first/last names in Supabase Auth metadata. The workspace shows the verified account name/email, and Settings supports name updates and confirmed email changes. Account deletion is clearly marked unavailable until its secure server backend and retention workflow are configured; no active deletion control is exposed.

| Page | Implemented in source |
| --- | --- |
| Dashboard | Continue an unfinished lesson, account-specific completion/practice metrics, compact topic rows, and recent activity |
| Career Paths | Six selectable paths, saved account preference, and matching dashboard/study/practice focus |
| Study Topics | Search, path filtering, topic details, real sample lesson counts, and useful empty states |
| Lessons | Six sample lessons, objectives/examples/checks, saved reading positions and completion, and previous/next navigation |
| Practice | Authenticated server grading, retry-safe saved submissions, conceptual self-review, and unexecuted saved Python/SQL drafts |
| Progress | Saved completion, descriptive practice scores, UTC submission activity, and topic comparisons with no invented mastery |
| Settings | Persistent Auth name/email/career path, temporary study preferences, and light/dark theme |

Navigation, filters, answer feedback, and preferences use React state. Your primary career path persists across refresh and sign-in. Other study/appearance preferences survive client navigation and reset on refresh. Quiz drafts reset when leaving their question. Lesson bookmarks and completion are stored in Supabase when server configuration is complete. Dashboard/progress metrics describe saved account activity; missing configuration produces an error, not fictional fallback metrics. Mastery remains unassessed.

The sample library includes eight topic categories and six lessons covering Python variables, loops, lists, SQL SELECT, SQL JOIN, and Big O. Other categories show an honest empty state. The thirteen sample questions support server-graded multiple choice and ungraded self-review; keys and solutions are excluded from initial browser payloads. The keys were previously public, so these samples cannot establish secure assessment evidence. Coding drafts are never executed.

## Project Purpose

Technical interview preparation often spans disconnected tutorials, question banks, and generic chat tools. Candidates can struggle to identify knowledge gaps, choose useful practice, and judge whether their understanding is improving.

Interview Compass aims to provide:

- **Personalized learning:** Relevant curriculum for selected career paths, followed by study plans that account for prerequisites, available time, and interview goals.
- **Knowledge-gap identification:** Topic-level evidence from independently graded answers, with diagnostic testing added in Phase 2.
- **Performance tracking:** A clear distinction between learning activity, assisted practice, and demonstrated independent performance.
- **Connected preparation:** Explanations, practice, feedback, and review within one learning workflow.

Performance estimates will show evidence limits. They are intended to guide preparation, without promising hiring outcomes or certified skill measurements.

## Planned Features

The table below describes the full product roadmap. The frontend samples above demonstrate parts of the interface; they do not fulfill the complete backend, content-review, persistence, or security requirements.

| Feature | Planned scope | Phase |
| --- | --- | --- |
| AI-powered tutoring | Text explanations, examples, and hints grounded in published topic and lesson content; selectable explanation levels | 1 |
| Career-specific preparation paths | Six selectable paths with shared foundational content and a primary path preference | 1 |
| Interactive lessons | Reviewed objectives, worked examples, embedded checks, and saved lesson progress | 1 |
| Quizzes and adaptive practice | Reviewed single-choice quizzes first; diagnostic testing and evidence-based difficulty adjustment later | 1; adaptation in 2 |
| Personalized study roadmaps | Editable, capacity-aware plans based on prerequisites, goals, and demonstrated gaps | 2 |
| Progress tracking and analytics | Basic dashboard, evidence counts, and quiz history first; trends and plan adherence later | 1; expanded in 2 |
| Spaced repetition | A timezone-aware due-review queue with deterministic interval updates | 2 |
| Job description analysis | Optional pasted-text analysis with consent, supporting excerpts, and learner-confirmed topic mappings | 2 |
| Coding challenges | Python exercises in Monaco Editor, graded through a managed isolated runner | 3 |
| SQL practice | Conceptual lessons and quizzes first; executable read-only PostgreSQL exercises over disposable synthetic datasets later | 1; execution in 3 |
| Mock technical interviews | Server-timed mock assessments, text-based interview simulations, and evidence-based reports | 3 |

### Career Paths and Initial Coverage

The planned selectable paths are Software Engineering, Data Analytics, Data Science, Business Analytics, Technology Consulting, and General Technical Interview Preparation. Learners will be able to select multiple paths and designate one as primary.

The Phase 1 content target is **8 published topics, 8 reviewed lessons, and 40 reviewed single-choice questions**, with at least four relevant topics mapped to each path. The initial topics are Python fundamentals, data structures, algorithm complexity, SQL fundamentals, relational data concepts, descriptive statistics, probability fundamentals, and technical problem framing.

This is shared foundational coverage. Phase 1 Python and SQL preparation will use explanations and conceptual quizzes; executable practice belongs to Phase 3.

## Planned Technology Stack

The frontend uses Next.js, React, TypeScript, Tailwind CSS, shadcn/ui primitives, and Lucide React. Node and npm are pinned and an npm lockfile is present. Official Supabase JavaScript/SSR clients provide email authentication and persistent study data; Zod validates server inputs. OpenAI, Monaco, the runner, and hosting remain planned.

| Technology | Intended role |
| --- | --- |
| Next.js App Router | Application routes, Server Components, and server workflows |
| TypeScript | Strict typing for UI, learning rules, and service boundaries |
| Tailwind CSS | Consistent styling and design tokens |
| shadcn/ui | Accessible interface primitives |
| Supabase | Authentication and managed database services |
| PostgreSQL | Relational curriculum, learner records, transactions, and row-level security |
| OpenAI API | Server-side tutoring and bounded, validated AI tasks |
| Monaco Editor | Python and SQL editing in Phase 3 |
| Managed isolated runner | Phase 3 code execution outside application and production database infrastructure; provider selection deferred |
| Vercel | Planned application hosting and preview deployments |
| GitHub | Source control and planned continuous integration |

## How the Application Will Work

The intended journey will expand as each phase is delivered:

1. **Choose a goal — Phase 1.** Create an account, select career paths and a primary path, set a timezone, and optionally record an interview date. The initial date display will be a countdown.
2. **Establish a baseline — Phase 2.** Complete a resumable diagnostic to identify topic gaps. Limited evidence will remain visible.
3. **Review a study roadmap — Phase 2.** Set available days and daily study time. Review an editable plan that respects prerequisites and capacity, and highlights work that cannot fit before the deadline. Optional job analysis will refine relevance after the learner confirms mappings.
4. **Study and ask for help — Phase 1.** Browse relevant lessons, complete embedded checks, resume learning, and request contextual explanations or hints from the tutor.
5. **Practice and review — Phases 1–3.** Begin with reviewed quizzes, add adaptive difficulty and spaced repetition in Phase 2, then practice executable Python/SQL and mock interviews in Phase 3.
6. **Inspect progress and adjust — Phases 1–3.** Review independent performance, assistance, evidence counts, lesson activity, and history. Later phases will add trends, replanning, and mock reports.

The Phase 1 learning loop will work without a diagnostic or generated schedule: select paths, study, take quizzes, and review a dashboard with one rule-based next action. Core lessons and deterministic quizzes are designed to remain usable when AI is unavailable.

## AI Architecture

The proposed architecture uses one modular Next.js application and a deterministic learning orchestrator. Tutor, Practice, Assessment, and Study Planner describe capability boundaries within the application; no autonomous multi-agent framework is planned.

| Capability | Planned responsibility |
| --- | --- |
| Tutor | Use bounded server-side AI calls to explain authorized published content and offer hints using a short window of the learner's own conversation history |
| Practice | Select reviewed questions through ordinary application logic; optionally assist with offline question drafts in Phase 2, subject to validation and human/developer review before publication |
| Assessment | Grade quizzes deterministically from private answer keys; later use trusted isolated execution results, while keeping qualitative AI feedback separate |
| Study Planner | Apply deterministic prerequisite, priority, and capacity rules in Phase 2; optionally use AI to explain an already validated plan |

Authentication, ownership, scores, schedules, and budgets will remain under application control. OpenAI calls will pass through a server-only adapter with per-user limits and a configured global budget. Models will not receive hidden assessment keys or credentials.

Only eligible independently graded answers will contribute to objective mastery estimates. Lesson completion, time spent, assisted answers, and AI prose feedback will remain separate. The proposed database design uses row-level security, private answer storage, and atomic grading and evidence updates.

## Development Roadmap

The frontend foundation and Step 3B authentication are implemented. The three full product phases below remain incomplete. Further backend services and later capabilities require their own authorized development scope.

| Phase | Planned deliverable | Status |
| --- | --- | --- |
| **1 — Functional MVP** | Authentication, path selection and optional interview date, minimum reviewed curriculum, single-choice quizzes, basic dashboard/history, settings, and account deletion | Authentication and sample persistence implemented; hosted verification, reviewed content, deletion, and remaining MVP gates pending |
| **2 — Adaptive Learning** | Interview research, grounded tutoring with usage limits, diagnostics, capacity-aware study plans, adaptive difficulty, spaced repetition, expanded analytics, and reviewed AI draft tooling | Planned; follows a stable Phase 1 |
| **3 — Advanced Interview Preparation** | Monaco-based Python/SQL practice with managed isolation, timed mocks, text interview simulations, and advanced reports | Planned; follows Phase 2 and runner verification |

Phase gates will require evidence from behavior, security, content, accessibility, and relevant AI evaluations. Detailed task dependencies and release criteria are in [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md).

## Getting Started

Use **Node.js 24.22.1** and **npm 11.19.1**. Study routes now require a Supabase account session and the existing public provider configuration.

```bash
npm ci
npm run dev
```

Open the URL printed by Next.js, normally `http://localhost:3000`. The root route opens the dashboard.

Keep the existing `.env.local`, or copy `.env.example` into it on a new checkout and replace the public Supabase URL and publishable-key placeholders. Set `APP_URL` to the application origin (required in production; HTTPS outside localhost). Development defaults to `http://localhost:3000`. Open `/signup` or `/login`; signed-in users can sign out from the workspace header. Configure email confirmation and redirect URLs using [the authentication setup guide](DEVELOPER_GUIDE.md#step-3b-authentication-and-dashboard-configuration). For saved study progress, also configure `SUPABASE_SECRET_KEY` from the same primary project and restart Next.js; `npm run check:study` diagnoses missing/invalid-format setup without displaying values. Keep disposable hosted-test settings in their separate ignored environment file. `.env.local` stays ignored. `npm run check:supabase` only verifies stateless local client initialization, not hosted authentication or database access.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run typecheck` | Strict TypeScript checks |
| `npm run lint` | ESLint checks |
| `npm run test:content` | Dependency-free fixture integrity checks with Node 24 |
| `npm run check:study` | Redacted local study setup check; no network; missing server key must be configured and Next.js restarted |
| `npm run check:supabase` | Redacted local initialization check using `.env.local`; no network requests |
| `npm test` | Vitest grading and content-integrity tests |
| `npm run test:e2e` | Playwright learner flows and accessibility checks; requires Chromium |
| `npm run build` | Production build |
| `npm start` | Serve an existing production build |

Install the test browser with `npx playwright install chromium`, or use an already installed Chrome/Edge browser through `PLAYWRIGHT_CHANNEL`. The frontend has passed lint, TypeScript, unit tests, production build, and browser checks; run the relevant checks again after changes.

See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for the folder structure, state flow, quiz logic, content-editing instructions, verification limits, and troubleshooting.

| Document | Contents |
| --- | --- |
| [PRD.md](PRD.md) | Product scope, learner needs, acceptance criteria, and mastery evidence policy |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Application structure, server workflows, AI boundaries, and execution design |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Proposed phase-specific tables, ownership, access rules, and transactions |
| [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) | Ordered implementation tasks, dependencies, risks, and phase gates |
| [AGENTS.md](AGENTS.md) | Repository instructions, authorization boundaries, and development conventions |

## Future Development

The long-term vision is an employer-neutral technical interview preparation platform that adapts across multiple career paths through curriculum data and learning evidence. Development will progress from a small, reviewed learning loop to feasible personalized plans, recurring review, and realistic interview practice.

Curriculum breadth and recommendations will expand as reviewed content and evaluation evidence support them. The focus will remain on useful explanations, transparent performance estimates, learner control, and a maintainable architecture.
