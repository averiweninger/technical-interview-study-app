# Product requirements

Status: proposed full-product requirements, 2026-10-21. The frontend prototype demonstrates portions of ONB-01, LIB-01, LES-01, QUIZ-01, PROG-01, and HIST-01 using public samples and temporary state. Step 3B implements email/password authentication, confirmation, session refresh/logout, and protected routes, but AUTH-01 remains incomplete pending password recovery and hosted configuration/security verification. The user reports the Step 3C schema/security checks passed. Step 3D implements saved lesson activity (LES-01), immutable server-graded free-practice submissions (partial QUIZ-01), and account-specific summaries (partial PROG-01/HIST-01). Previously public samples are explicitly not mastery evidence; full reviewed assignments, history pagination UI, and atomic evidence/mastery updates remain planned. Tutor, account deletion, and graded evidence persistence remain unimplemented. See README.md for implemented scope; the acceptance criteria below remain the full-product plan.

## Problem and product outcome

Technical interview candidates often split their preparation between static tutorials, question banks, and generic chat tools. They lack a coherent view of what they understand, where they struggle, and what to practice next. Build a general-purpose preparation platform that connects instruction, practice, feedback, and evidence of learning. Content and recommendations must support multiple career paths and employers; the product is not specific to AT&T or any other company.

The long-term experience is: choose career paths and an interview goal, optionally research a company/job, confirm a preparation profile, take a diagnostic, receive a realistic roadmap, learn and practice, revisit weak topics, and complete realistic mock assessments. The three capability phases follow Steps 3–9 in [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md). The latest sequence moves the tutor to Phase 2 after research; it does not authorize implementation.

## Users and needs

| Persona | Need | Successful outcome |
| --- | --- | --- |
| Student or recent graduate | Structure and approachable explanations | Completes foundational lessons and demonstrates improvement on new questions |
| Career changer | Connect existing skills to a target role | Understands prerequisites and focuses on relevant gaps |
| Working professional | Efficient preparation within limited time | Receives a feasible schedule and evidence of readiness by topic |
| Candidate with an upcoming assessment | Practice under a deadline | Understands remaining coverage and completes timed practice |

English-language, individual learner accounts are the initial audience. Hiring teams, classrooms, employer screening, payments, certifications, social features, native mobile apps, and multilingual content are outside the initial three-phase commitment. Do not promise employment outcomes or certified skill measurements.

## Product principles

- Measure progress from graded responses, with the amount and recency of evidence visible. Lesson completion and time spent are separate activity measures.
- Offer hints before solutions; distinguish assisted practice from independent performance.
- Keep preparation usable when AI is unavailable or a usage allowance is exhausted.
- Make recommendations understandable and editable. A deadline must not produce an impossible schedule or a misleading readiness guarantee.
- Use a small reviewed curriculum first. Breadth expands through data and content, without hardcoded employer or career-specific application branches.

## Exact first working MVP: Phase 1

The first working MVP is a deployable private beta with the following complete learner loop:

1. Sign up with email and password, confirm email, sign in, reset a forgotten password, and sign out using Supabase Auth.
2. Select one or more of six career paths: Software Engineering, Data Analytics, Data Science, Business Analytics, Technology Consulting, and General Technical Interview Preparation. Select a primary path, timezone, and optional target interview date. These preferences are editable.
3. Browse a path-filtered topic library, open a lesson, complete embedded checks, and resume learning later.
4. Take a short quiz of reviewed single-choice questions. See deterministic grading, a reviewed explanation, and a hint/solution flow. Save results across devices.
5. Continue learning through reviewed explanations and hints. The text tutor is deferred to Step 6, after the research/profile foundation.
6. View a dashboard showing attempted topics, performance estimates, evidence counts, lesson activity, recent quiz history, and one rule-based next action. A stored interview date appears as a countdown; it does not yet generate a schedule.
7. Change settings and request account/data deletion through an authenticated flow.

Launch content minimum: **8 published topics, 8 reviewed lessons, and 40 reviewed single-choice questions**, at least one lesson and five questions per topic. Topics: Python fundamentals, data structures, algorithm complexity, SQL fundamentals, relational data concepts, descriptive statistics, probability fundamentals, and technical problem framing. Each career path maps to at least four relevant topics; shared content is expected. Publish the actual coverage rather than suggesting a comprehensive curriculum for every path. Phase 1 Python and SQL content consists of explanations and conceptual quizzes, with no code execution.

Each lesson includes a learning objective, prerequisites, a worked example, an embedded check, and a concise takeaway. Quizzes use easy and medium items initially. Content publication uses validated repository seed/import files and a developer review workflow; no content-management UI is required.

Explicitly excluded from Phase 1: AI tutoring, diagnostics, generated study roadmaps, job-description collection/research, adaptive difficulty, spaced-repetition scheduling, AI-generated learner-facing questions, executable Python/SQL, Monaco Editor, timed mocks, interview simulations, advanced reports, autonomous agents, vector search, and notifications. Store optional interview dates now; add job-specific inputs in Step 5. Do not collect text before it has a supported use.

## Job-specific preparation and research evidence

This future Phase 2 capability connects three systems: the Learning Engine supplies shared published content; the Interview Research Engine produces an owned job-specific preparation profile; the Personalization Engine combines confirmed topic relevance with curriculum prerequisites and independent performance. Career paths and profiles reference stable shared topic/skill identifiers. They do not own copies of lessons, questions, or mastery records.

The learner enters a company name, job title, pasted job description or public posting URL, and an optional interview date/timezone. Public web-search results supplement these inputs. Show the input preview and obtain consent before sending job text or company/role search terms to external providers; omit unrelated profile/history data. If a URL is inaccessible, offer pasted text. If research is unavailable, sparse, stale, or contradictory, preserve ordinary career-path learning and explain the limitation.

| Evidence class | Meaning and presentation |
| --- | --- |
| `official` | Information explicitly supported by a verified company-controlled source. Job requirements and interview-process claims stay distinct; a required skill does not prove an interview question will be asked. |
| `candidate_report` | An attributed candidate account. Show available role/location/date context, uncertainty, and conflicting reports; anecdotes are not company policy or representative frequency estimates. |
| `ai_prediction` | An inference about likely topics or preparation priorities. Label it as a prediction, cite supporting premises when available, and state when direct evidence is absent. Never describe it as an observed interview fact. |

Every non-prediction finding requires a supporting source citation. Show source URL, publication date when known, research/retrieval date, and why the evidence is relevant; unknown dates remain unknown. A search snippet is identified as a snippet, not a verified full-page reading. Evaluate authority, match to company/role, recency, and agreement/conflict without treating a model's confidence as calibrated probability. Duplicate or syndicated reports do not count as independent corroboration. Research snapshots are dated; refreshing creates a new draft profile version for review.

The profile separates job requirements, reported interview process, and predicted topics. Learners can accept/reject mappings to existing curriculum topics/skills and manually add supported topics. Unsupported skills appear as coverage gaps; research cannot automatically publish new curriculum. Only confirmed mappings influence plans. Predictions may suggest priorities after confirmation, while retaining their labels and never raising mastery. Tutor research references preserve these same evidence distinctions.

## Functional requirements and acceptance criteria

IDs are stable references for development and tests. Every criterion below describes intended behavior, not a completed check.

| ID / phase | User story | Acceptance criteria |
| --- | --- | --- |
| AUTH-01 / 1 | As a learner, I can securely access my account. | Confirmation and reset links use allowlisted destinations; expired/invalid links have recovery guidance; sign-out ends access; unauthenticated requests cannot read learner records. A second account cannot read or mutate the first account's records through UI, handlers, RPCs, or the Supabase Data API. |
| ONB-01 / 1 | I can choose relevant preparation paths and a goal. | All six paths exist; at least one selection and exactly one selected primary path are required; choices persist; timezone is validated; interview date can be omitted, changed, or cleared. Past dates produce a neutral expired-goal state. |
| LIB-01 / 1 | I can find what to learn. | Library filters by selected paths, removes duplicates, and shows prerequisites and published coverage. Drafts and answer keys are never included in public content responses. An empty filter offers a useful reset. |
| LES-01 / 1 | I can study a concept and resume. | Lessons show objectives, examples, and checks; resume position persists; keyboard navigation works; completion changes activity only and cannot increase mastery. A check increases mastery only if it uses the same graded-attempt path as quizzes. |
| QUIZ-01 / 1 | I can practice and understand errors. | Only valid options for the assigned question version are accepted; server grades from a private key; feedback explains the correct reasoning and the selected mistake. Refresh/retry of one submission produces one grade. Pre-submission browser payloads do not expose solutions. |
| TUTOR-01 / 2, Step 6 | I can request help at my level. | Tutor has published topic/lesson context and beginner/intermediate/advanced styles; optional confirmed owned research retains citations, dates, and evidence labels. It defaults to hints for active questions and never receives protected keys. Busy/refusal/timeout/quota/interruption/retry states work. Research cannot override reviewed curriculum facts; disputed claims remain labeled. |
| PROG-01 / 1 | I can see what my results establish. | Dashboard separates lesson completion, assisted work, independent accuracy, and topic estimates; unseen topics say "Not assessed". It shows evidence count and last practice date; estimates update after committed grading and survive reload. |
| NEXT-01 / 1 | I know a useful next step. | A deterministic rule chooses an unassessed prerequisite, a weak relevant topic, or the next unfinished relevant lesson; the UI states why. This is not presented as an AI-generated personalized roadmap. |
| HIST-01 / 1 | I can review my learning. | History paginates sessions and graded attempts; filtering by topic works; stale requests do not mix different users' data. |
| PRIV-01 / 1 | I control my learning data. | Conversation deletion is available; account deletion requires fresh authentication and clear confirmation; all owned records and queued work are removed/cancelled under the documented deletion process. No secrets or raw prompts appear in operational logs. |
| DIAG-01 / 2 | I can establish a baseline. | A resumable diagnostic samples reviewed questions across relevant topics; insufficient evidence is labeled; final grading updates mastery once. No AI-generated score replaces deterministic grading. |
| PLAN-01 / 2 | I can follow a realistic plan. | Plan combines shared prerequisites/path requirements, a confirmed preparation-profile version when present, interview date, capacity, independent mastery, and due reviews. Each priority has a reason; work fits capacity or shows the shortfall. Replanning preserves completed work and creates a version. Research refresh alone does not overwrite an active plan. |
| ADAPT-01 / 2 | Practice fits my demonstrated ability. | Difficulty follows documented score/evidence bands, changes at most one band at a time, and uses reviewed items. The user may override it. Sparse evidence does not trigger advanced questions. |
| REVIEW-01 / 2 | I revisit weak material. | A due queue is timezone-aware; graded reviews deterministically update intervals; duplicate submissions do not advance twice; missed days do not create an unbounded daily workload. |
| JOB-01 / 2, Step 5 | I can describe my interview goal. | Company, job title, pasted description or public URL, and optional local interview date persist to owned records. Input preview/consent precedes external processing. URL failure offers pasted text; job/profile deletion removes owned derived research under the deletion policy. |
| RESEARCH-01 / 2, Step 5 | I can inspect interview research. | Bounded server-side web search yields findings with source URLs, dates, citations, and the evidence classes defined above. Official claims require verified provenance; candidate reports and predictions stay distinct. Missing, stale, conflicting, duplicate, or snippet-only evidence is visible. No unsupported exact-question or hiring-success guarantee is made. |
| PROFILE-01 / 2, Step 5 | I can review a preparation profile. | A dated version links to shared topic/skill IDs and separates requirements, reports, predictions, and unsupported coverage gaps. I can confirm/reject mappings. Refresh creates a draft without replacing the active version; only confirmed mappings affect relevance. All direct APIs/RPCs enforce ownership. |
| ANALYTICS-01 / 2 | I can understand changes over time. | Charts distinguish assisted/independent work, difficulty, time window, and evidence volume. Small samples have visible limitations; data is derived from attempts and mastery events. |
| CODE-01 / 3 | I can practice Python and SQL safely. | Jobs run outside the application/data infrastructure in isolated environments with time/memory/output/network limits. Users cannot access credentials, other learners, hidden tests, or the production database. Run failure is distinct from an incorrect answer. |
| MOCK-01 / 3 | I can practice under timed conditions. | Server owns start/deadline and immutable assigned items; autosave and reconnect work; expired submissions cannot alter results; scores release after completion; hints/solutions are blocked until permitted. |
| SIM-01 / 3 | I can practice explaining my reasoning. | Text-only interview simulation follows a topic blueprint and explicit rubric; qualitative feedback is labeled AI feedback. It does not independently change objective mastery. Voice/video is deferred. |
| REPORT-01 / 3 | I can review interview readiness evidence. | Report shows topic coverage, mock outcomes, recurring errors, and evidence limits; export omits private keys, hidden tests, and unnecessary personal data. No pass-probability claim is implied. |

## Mastery and recommendation policy

Phase 1 uses an interpretable performance estimate, not a calibrated probability of interview success. For each topic, take the most recent 30 eligible graded attempts. Eligibility: independently answered, reviewed deterministic item, no known same-day hint/solution/tutor exposure before answering across any attempt of that logical question, and only the first finalized attempt for a logical question on a UTC calendar day. UI-level flags are insufficient: exposure is recorded by the server before content is released. Practice retries remain useful but do not create extra evidence that day, even if the first answer was assisted. A different version or fresh attempt of the same question does not bypass the daily cap. External assistance cannot be detected reliably and is not claimed to be prevented.

For score `s` in `[0,1]` and difficulty weight `w` (easy 1, medium 1.5, hard 2 when introduced), calculate `alpha = 1 + sum(w*s)`, `beta = 1 + sum(w*(1-s))`, and `estimate = alpha/(alpha+beta)`. Store algorithm version, eligible attempt count, distinct question count, and latest evidence timestamp. With no evidence, display "Not assessed" instead of the prior's 50%. Scores below 0.5 suggest "Needs practice"; 0.5 to below 0.8 suggest "Developing". At least 0.8 can be "Strong evidence" only with five distinct questions across at least two UTC dates; otherwise label "Limited evidence". All bands show evidence counts. These are product heuristics to evaluate in the beta.

Primary question-to-topic attribution is sufficient initially. Do not invent subtopic mastery from an item that has no corresponding grading signal. Parent-topic summaries are labeled aggregates, not duplicated independent evidence. Assisted attempts, lesson completion, chat messages, self-reported confidence, and time spent never raise objective mastery. Later graded coding outcomes can contribute after runner validation; subjective AI feedback stays separate.

Phase 1 next-action order: unmet relevant prerequisite; relevant attempted topic below 0.5; unassessed relevant topic; next unfinished relevant lesson. Stable ties use curriculum order. Phase 2 adds due reviews, capacity, date, and user-confirmed job relevance as described in [ARCHITECTURE.md](ARCHITECTURE.md).

## Experience and design requirements

- Planned core navigation: Dashboard, Learn, Practice, History, Settings. Phase 2 adds Preparation Profiles, Tutor, Study Plan, and Reviews; Phase 3 adds Mock Interviews. Preserve functioning frontend navigation and hide unfinished destinations until their step is implemented.
- Desktop uses a restrained sidebar and readable main content width; mobile uses an accessible menu and a single-column flow. Prioritize a clear primary next action, topic evidence, and recent activity on the dashboard.
- Use Tailwind tokens and shadcn/ui primitives for consistent spacing, typography, forms, dialogs, and focus states. One restrained accent, neutral surfaces, and semantic feedback colors; avoid excessive dashboard tiles and decorative charts.
- Target WCAG 2.2 AA: keyboard access, visible focus, correct landmarks/labels, text alternatives, sufficient contrast, reduced-motion support, and non-color status cues. Charts need equivalent text/table summaries. Streamed chat must not overwhelm screen-reader announcements.
- Each major screen needs loading, empty, error, unauthorized, and success states. Preserve quiz input on transient failures; never imply an uncommitted result was saved.
- Test at 360px, 768px, and 1440px widths. On slower connections, core lessons and quizzes remain usable; load tutor enhancements and, later, Monaco only when needed.

## Quality, measurement, and launch gates

Targets below are beta goals, not measured results or availability promises. Define a representative mobile device/network and staging dataset before measuring.

| Area | Target / gate |
| --- | --- |
| Core performance | Dashboard/library LCP at most 2.5 seconds at the 75th percentile; ordinary reads and grading p95 under 1 second excluding network and AI; fix regressions before widening beta |
| Tutor | Initial pending state immediately; target first streamed text within 5 seconds, with bounded total timeout and explicit fallback |
| Reliability | No duplicate grades, mastery updates, budget charges, or review transitions on replay; explicit recovery for partial AI streams |
| Security | Cross-user and direct-API/RPC isolation tests pass; private keys/tests never reach learner payloads; no execution of untrusted code in app infrastructure |
| Content | Minimum seed coverage is met; every published item has a reviewed key, explanation, topic, difficulty, and provenance |
| Accessibility | No serious/critical automated findings in core flows plus manual keyboard and screen-reader spot checks |
| AI quality | Reviewed evaluation set passes factuality, hint behavior, authorization, injection, refusal, and cost/latency gates before enabling tutor |

Instrument activation (onboarding plus first independent quiz), weekly independent practice, new-question accuracy by topic/difficulty, return practice, tutor helpfulness reports, and tutor cost per active learner. Track denominators; repeated exposed questions must not inflate the improvement metric. Collect the minimum necessary event metadata and avoid recording private conversation content in analytics. Beta targets for retention and learning improvement are set after baseline observation rather than fabricated now.

## Rollout and unresolved choices

Phase 1 (Steps 3–4): persistent reviewed learning loop. Phase 2 (Steps 5–7): interview research/profiles, grounded tutor, diagnostics, adaptive planning, and reviews. Phase 3 (Steps 8–9): isolated executable practice, mocks, and release hardening. [DEVELOPMENT_ROADMAP.md](DEVELOPMENT_ROADMAP.md) is authoritative for implementation order and dependencies; tests accompany each step.

Assumptions to revisit during implementation: initial English-only beta, email/password auth, no billing, developer-curated content, and foundational coverage shared by six paths. Before enabling Steps 5–6, evaluate actual search/model access, evidence quality and cost, and configure provider budgets. Verify email delivery and deployment/database regions before release. Runner selection is a Step 8 gate and must not delay foundational learning. These external choices do not block this documentation update.
