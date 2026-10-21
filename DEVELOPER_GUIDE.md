# Developer Guide

Interview Compass currently contains an interactive frontend prototype. Its lessons and question feedback are usable in the browser once dependencies are installed. Progress charts and study history use explicitly labeled mock records. There is no authentication, database, AI integration, code runner, or deployment configuration.

The implementation intentionally stops before the complete Phase 1 product in [PRD.md](PRD.md). The user's frontend request permits public sample answers and local grading for demonstration. Production assessment keys must move behind authenticated server workflows before real assessments are introduced.

## Stack and setup

Next.js App Router supplies routes, layouts, and React rendering. TypeScript describes data and component props. Tailwind CSS provides design tokens and utility classes. Small shadcn/ui primitives live in the repository, and Lucide React supplies icons. React state is sufficient for the interactions in this prototype.

Node **24.22.1** and npm **11.19.1** are pinned in `.nvmrc`, `package.json`, and the package-manager field. Install those versions and ensure `node --version` and `npm --version` work in your terminal. Reopen your terminal or editor after installing Node if needed.

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js, normally `http://localhost:3000`.

**Current installation limitation:** Registry access was declined during this implementation session. The offline install also failed because packages were not cached. There is no generated lockfile and dependency compatibility has not yet been verified. Dependency ranges in `package.json` are provisional until the first successful install. Generate and review `package-lock.json`, resolve any compatibility errors, pin the resolved direct dependency versions, and keep npm as the only package manager. After a lockfile exists, use `npm ci` for reproducible installations. No credentials or environment variables are needed for this frontend.

The manual scaffold preserves the existing repository and documents. It follows the official [Next.js installation guide](https://nextjs.org/docs/app/getting-started/installation), [Tailwind Next.js guide](https://tailwindcss.com/docs/installation/framework-guides/nextjs), and [shadcn/ui manual setup](https://ui.shadcn.com/docs/installation/manual). Next.js 16 uses asynchronous route parameters and a separate ESLint command.

## Folder structure

```text
src/
  app/                    Routes, metadata, shared layout, and global styles
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
  features/
    curriculum/           Path selection, topic filtering, content types
    practice/             Question types, local grading, practice state
    progress/             Dashboard composition
    settings/             Temporary preferences and settings form
  lib/                    Shared class-name helper
scripts/                  Dependency-free content validation
tests/unit/               Grading and content-integrity tests
tests/e2e/                Learner flows, responsiveness, accessibility
```

There are no empty backend modules. Add `src/server/` and `supabase/` when the relevant backend work is authorized.

## Routing and layouts

App Router creates a URL from folders under `src/app`. For example, `src/app/progress/page.tsx` renders `/progress`. A folder in brackets is a dynamic segment: `/learn/sql` passes `sql` as `topicSlug` to `learn/[topicSlug]/page.tsx`. Unknown topic or lesson IDs call `notFound()` and show the recovery page.

`src/app/page.tsx` redirects `/` to `/dashboard`. `layout.tsx` wraps every page with the preference provider and application shell. Layouts stay mounted during client navigation, which lets temporary preferences survive navigation through Next.js `Link` components. A full page reload creates fresh state.

`loading.tsx`, `error.tsx`, and `not-found.tsx` provide route-level loading and recovery states. Filtered topic and practice screens also have empty states with reset controls. The native mobile navigation disclosure can be opened and closed by keyboard; choosing a link closes it.

Future HTTP endpoints would live in `src/app/api/.../route.ts`. A route handler should validate identity and input, then call a server use case. No API routes are needed for this prototype.

## Server and Client Components

Components are Server Components by default. The lesson route renders written content and example code on the server. Its knowledge check is a smaller Client Component because it needs browser events and state.

A file beginning with `"use client"` defines a client boundary. Examples include the quiz form, topic filters, career-path selector, and settings. The application shell needs `usePathname()` to mark the current navigation link. Passing server-rendered page content as `children` through a Client Component does not turn every page module into a Client Component.

Client code is visible to the browser. **Every question answer in this demo is intentionally public.** Hiding the answer until a button is clicked is an interface interaction, not a security boundary. Real private keys and grading must never be placed in the client question objects.

## Components and data flow

Routes stay small and compose feature components. Shared presentation belongs in `components/`; page-specific behavior stays in `features/`. For example:

1. `data/mock/curriculum.ts` exports typed topic records.
2. `TopicLibrary` filters those records using the search input and selected path.
3. `TopicCard` receives one topic through a prop, derives its real sample lesson count, and links to its topic route.
4. The route finds lessons by `topicId` and renders links to them.

`Button` adapts the shadcn/ui pattern. Its `variant` and `size` props choose styles. `asChild` uses Radix Slot to style a `Link` without creating a button nested around a link. `Card` provides a consistent surface. `Progress` uses native HTML progress semantics to avoid adding a chart or progress library.

## State and persistence

| State | Location | Lifetime |
| --- | --- | --- |
| Display name, selected path, study goal, explanation level, theme | `DemoPreferencesProvider` React context | Survives client navigation; resets on refresh |
| Unsaved settings draft | `SettingsForm` | Until leaving the settings route |
| Search, path filter, practice filters | Feature component state | Until leaving that route |
| Selected quiz option, feedback, written/code draft | Question component | Until changing question or leaving |
| Multiple-choice visit totals | `PracticeWorkspace` | Until reset, leaving the route, or refresh |
| Lesson completion marker | `LessonCompletion` | Until leaving the lesson |
| Dashboard/progress/history | Static fixtures | Never updated by these interactions |

Only the provider shares state. There is no state-management library, localStorage, cookie, or database persistence. This makes the prototype easy to inspect and avoids presenting temporary data as saved learning evidence.

Profile and study settings apply on form submission. Native form constraints and explicit checks reject a blank trimmed name or invalid study minutes. The saved display name changes the greeting; the path is shared with Career Paths. Theme controls apply immediately through the provider, keeping Settings and the header synchronized. Time and explanation preferences are visibly labeled inputs for future capabilities.

## How practice works

`PracticeQuestion` is a discriminated union: the `kind` field selects one of three shapes. TypeScript knows that only a multiple-choice question has `options` and `correctOptionId`. This prevents accidental attempts to read those fields from a coding exercise.

For multiple choice:

1. The learner selects a native radio input; `selectedId` changes through `useState`.
2. Submitting the form calls `gradeAnswer`, a small pure function.
3. The function rejects unknown option IDs or compares the selected ID with the public demo answer.
4. The form records feedback, disables further submission, and calls the parent's optional `onGrade` callback.
5. `PracticeWorkspace` stores one boolean per question ID. Revisiting a question replaces its visit result rather than inflating the count. This visit accuracy is temporary and separate from mock analytics.

Conceptual questions accept a draft and reveal a model answer for self-review. Coding exercises accept an optional draft and reveal an example solution. Neither is graded or executed. Skipping a question does not count as answering it. The progress bar in practice indicates the current position in the question set, not knowledge mastery.

## Mock data and adding content

Records link through stable string IDs. Topics are shared across career paths rather than duplicated. Lesson counts come from `lessons.ts`. Progress records intentionally describe a fictional broader learning history; they do not claim completion of the six available sample lessons. Totals are derived from the same progress records on both Dashboard and Progress.

To add a topic:

1. Add a `Topic` record to `src/data/mock/curriculum.ts` with a unique kebab-case ID, description, category, difficulty, symbol, and accent.
2. Add its ID to appropriate career paths' `topicIds` arrays.
3. Add one illustrative `topicProgress` row with a valid completion percentage and consistent answer totals. Use `Not assessed` when there are no sample attempts.
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

`globals.css` defines semantic colors and two theme palettes. Components use the same Tailwind tokens, restrained teal accent, spacing, and surfaces. The system font avoids a build-time font download. Charts include per-day text; tables have headers and captions; progress elements have accessible names. The interface includes a skip link, visible keyboard focus, native form controls, feedback status messages, and reduced-motion handling.

The shell uses a desktop sidebar from 768px upward and a native disclosure menu below it. Long code samples and the progress table scroll within their containers. Automated accessibility checks complement a real browser, keyboard, and screen-reader review; those checks have not yet been run in this environment.

## Future integrations

When authorized, introduce verified Supabase identity and data access in server use cases. Replace public demo grades with authenticated assignments, private keys, atomic grading, and the PRD mastery policy. Create migrations and generated database types rather than mapping frontend interfaces directly onto assumed tables.

AI calls will belong in guarded `src/server/ai/` adapters with grounded context and budget controls. They must not be added directly to Client Components. The Tutor, Practice, Assessment, and Planner boundaries in the architecture remain ordinary application capabilities. Executable Python/SQL and Monaco remain Phase 3 work, using a managed isolated runner outside the application and production database.

## Commands and verification

| Command | Purpose | Status in this session |
| --- | --- | --- |
| `npm install` | Resolve dependencies and create the first lockfile | Blocked by registry access; offline attempt found no cache |
| `npm run dev` | Start local Next.js development | Requires installed dependencies |
| `npm run typecheck` | Check strict TypeScript types | Requires installed dependencies |
| `npm run lint` | Run ESLint independently of the build | Requires installed dependencies |
| `npm run test:content` | Validate fixture relationships and metadata with Node 24 | Passed |
| `npm test` | Run Vitest grading and content tests | Requires installed dependencies |
| `npx playwright install chromium` | Install the test browser after dependency setup | Not run; requires package/browser access |
| `npm run test:e2e` | Run learner flows at 360px, 768px, and 1440px, including axe checks | Requires dependencies and Chromium |
| `npm run build` | Produce a production build | Requires installed dependencies |
| `npm start` | Serve an existing production build | Requires a successful build |

The configured `typecheck`, `lint`, `test`, and `build` commands were attempted and stopped because `tsc`, `eslint`, `vitest`, and `next` were unavailable. Additional local checks parsed all 43 source/test TypeScript files with the editor's TypeScript 6.0.3, checked the dependency-free content/grading types, and exercised correct/incorrect/invalid grading and invalid content rejection with Node assertions. These checks passed but do not establish React/Next.js compatibility or browser behavior.

Browser tests cover selection/filtering, lesson navigation, correct and incorrect quiz feedback, self-review, display-only code, preferences, empty/unknown routes, responsive overflow, navigation, and automated accessibility. Test files are present; their existence is not evidence of a passing run.

## Troubleshooting

- **`node` or `npm` not found:** install the pinned Node version, ensure its directory is on PATH, and reopen the terminal. This session found Node under `C:\Program Files\nodejs`.
- **Registry `EACCES`, `ENOTCACHED`, or download errors:** allow the needed network access or install in a network-enabled environment. Offline installation works only when every required package is already cached.
- **`next`, `eslint`, `tsc`, or `vitest` not recognized:** dependencies are not installed successfully. Finish `npm install`; do not assume application code is responsible for this error.
- **Unsupported engine:** match the Node and npm versions in `package.json`. This project intentionally uses one package manager.
- **Port 3000 is occupied:** run `npm run dev -- --port 3001`. E2E tests use 3000 by default; update the test configuration if needed.
- **A topic has no lessons:** this is an intentional empty state. Add content in `lessons.ts` and link it to the correct topic ID.
- **Preferences disappeared:** temporary state resets on refresh and full-page navigation. Use app links to preserve it within a visit.
- **Quiz totals do not match the dashboard:** visit results are real temporary UI interactions; the dashboard is an independent illustrative fixture.
- **Cannot execute a coding solution:** execution is deliberately absent. The text area is a draft editor only.

The recommended next step is to finish dependency installation and run the configured verification checks, then review the frontend before authorizing a small backend slice.
