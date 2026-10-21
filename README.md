# Interview Compass

Interview Compass is an AI-powered adaptive learning platform in development, designed to help students and professionals prepare for technical interviews. The current frontend prototype connects educational sample lessons, interactive practice, and illustrative progress displays. The long-term plan adds grounded AI tutoring and evidence-based personalization.

**Status:** Initial development stage with frontend source implemented. Dependency installation and runtime verification are pending because registry access was declined during this session. No database, authentication, OpenAI integration, code execution, or deployment is configured. This is not the complete Phase 1 MVP.

## Frontend Prototype

| Page | Implemented in source |
| --- | --- |
| Dashboard | Welcome, sample study statistics, topic cards, activity, and an illustrative review queue |
| Career Paths | Six selectable paths, associated topics, and temporary selection shared with Settings |
| Study Topics | Search, path filtering, topic details, real sample lesson counts, and useful empty states |
| Lessons | Six substantive lessons, code examples, objectives, knowledge checks, and previous/next navigation |
| Practice | Multiple-choice feedback, conceptual self-review, and display-only Python/SQL exercise drafts |
| Progress | Clearly labeled sample completion, accuracy, mastery labels, activity, and topic comparisons |
| Settings | Temporary profile, career path, study preferences, and light/dark theme |

Navigation, filters, answer feedback, and preferences use React state. Preferences survive client navigation and reset on refresh. Quiz drafts and lesson markers reset when leaving their question or lesson. Dashboard statistics and mastery labels remain fictional fixtures and never represent the visitor's answers.

The sample library includes eight topic categories and six lessons covering Python variables, loops, lists, SQL SELECT, SQL JOIN, and Big O. Other categories show an honest empty state. All thirteen practice questions and their answers are public demonstration content; local quiz feedback is not secure server grading. Coding drafts are never executed.

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

The frontend manifest configures Next.js, React, TypeScript, Tailwind CSS, shadcn/ui primitives, and Lucide React. Node and npm are pinned; dependency installation and lockfile generation are pending. Supabase, OpenAI, Monaco, the runner, and hosting remain future integrations.

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

The authorized frontend foundation is implemented in source, with installation and runtime verification pending. The three full product phases below remain incomplete. Backend services and later capabilities require their own authorized development scope.

| Phase | Planned deliverable | Status |
| --- | --- | --- |
| **1 — Functional MVP** | Authentication, path selection and optional interview date, minimum reviewed curriculum, single-choice quizzes, text tutor with cost controls, basic dashboard/history, settings, and conversation/account deletion | Frontend prototype in source; complete MVP remains planned |
| **2 — Adaptive Learning** | Diagnostics, capacity-aware study plans, optional job description analysis, adaptive difficulty, spaced repetition, expanded analytics, and reviewed AI draft tooling | Planned; follows a stable Phase 1 |
| **3 — Advanced Interview Preparation** | Monaco-based Python/SQL practice with managed isolation, timed mocks, text interview simulations, and advanced reports | Planned; follows Phase 2 and runner verification |

Phase gates will require evidence from behavior, security, content, accessibility, and relevant AI evaluations. Detailed task dependencies and release criteria are in [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md).

## Getting Started

Use **Node.js 24.22.1** and **npm 11.19.1**. No environment variables, provider accounts, or credentials are required for the frontend.

```bash
npm install
npm run dev
```

Open the URL printed by Next.js, normally `http://localhost:3000`. The root route opens the dashboard.

**Setup limitation:** Installation could not complete in this session: npm registry access was declined, and the required packages were absent from the offline cache. No lockfile was fabricated. The first successful `npm install` must generate a reviewed `package-lock.json`; pin the resolved direct dependency versions then. Afterward, use `npm ci`. Until installation succeeds, the frontend cannot be claimed to build or run successfully.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run typecheck` | Strict TypeScript checks |
| `npm run lint` | ESLint checks |
| `npm run test:content` | Dependency-free fixture integrity checks with Node 24 |
| `npm test` | Vitest grading and content-integrity tests |
| `npm run test:e2e` | Playwright learner flows and accessibility checks; requires Chromium |
| `npm run build` | Production build |
| `npm start` | Serve an existing production build |

After dependencies are available, install the test browser with `npx playwright install chromium`. Content validation passed during implementation. Full typecheck, lint, unit tests, production build, and browser verification remain blocked by dependency installation.

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
