# Interview Compass Design System

Use this system for every frontend feature. The product is a study workspace: prioritize content, progress, and clear actions over promotion. The implementation lives in `src/app/globals.css`; shared primitives live in `src/components/ui`. Reuse both before introducing another component or style.

## Color palette and tokens

Components use semantic Tailwind classes such as `bg-background`, `text-foreground`, `border-border`, and `text-primary`. CSS variables supply the light and dark values. Avoid hardcoded colors in page components.

| CSS token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| `--background` | `#FAFAF8` | `#191E23` | Warm off-white workspace; neutral dark canvas |
| `--foreground` | `#20252B` | `#EDF0F2` | Main text and headings |
| `--card` | `#FFFFFF` | `#22292F` | Important panels and cards |
| `--primary` | `#315B75` | `#AAC8DC` | Actions, links, active navigation, chart bars |
| `--primary-hover` | `#27495E` | `#C2D9E8` | Primary action hover |
| `--primary-foreground` | `#FFFFFF` | `#1A2832` | Text on primary buttons |
| `--muted` | `#F1F3F4` | `#2C343C` | Quiet secondary surfaces and chart tracks |
| `--muted-foreground` | `#5E6872` | `#B5BFC8` | Supporting text; never lower opacity for body copy |
| `--border` | `#E5E7EB` | `#404A53` | Passive surface separators |
| `--input-border` | `#87939E` | `#8395A3` | Visible input, radio-option, and outline-button boundaries |
| `--selection` | `#EAF0F4` | `#2B3C49` | Selected navigation, career path, or answer |
| `--success` / `--success-surface` | `#286049` / `#EFF6F1` | `#ACD5BB` / `#26392E` | Correct-answer feedback |
| `--review` / `--review-surface` | `#80541D` / `#FAF5EB` | `#E4C38D` / `#3A3225` | Incorrect-answer feedback inviting review |
| `--danger` | `#A13832` | `#F0AAA2` | Invalid form controls |
| `--code-background` / `--code-foreground` | `#222D37` / `#E9EDF1` | `#1A222A` / `#E9EDF1` | Readable code examples |

The subtle panel border is not sufficient as the only boundary of an input. Use `--input-border` for controls. Color supports a written status and, where useful, a meaningful icon; it never replaces the label.

## Typography

The system stack uses the platform font, including Segoe UI on Windows. No font download or additional dependency is required. IBM Plex Sans may be adopted later if properly hosted and evaluated; it is not currently bundled. Code uses the system monospace stack.

| Role | Size | Weight / line height |
| --- | --- | --- |
| Page title | 24–28px, responsive | 600 / 1.3 |
| Lesson section or prominent panel heading | 18–20px | 600 / approximately 1.5 |
| Section title | 16px | 600 / 1.5 |
| Lesson prose and question options | 16px | 400 / 1.6–1.85 |
| Interface copy | 14px | 400–500 / 1.6–1.7 |
| Metadata and chart labels | 12px | 400–500; readable contrast |
| Metric values | 28px | 600; tabular numerals |

Use sentence-case, descriptive headings such as “Study topics” or “Progress overview.” Keep page titles compact. Avoid slogans, oversized welcome banners, excessive uppercase labels, and letter-spaced marketing headings.

## Spacing and shape

Layout spacing follows an 8px scale: `--space-1` through `--space-6` are **8, 16, 24, 32, 48, and 64px**. Tailwind equivalents include `gap-2`, `p-4`, `p-6`, `p-8`, `mt-12`, and `py-16`. Use 4px half-steps only for close label/icon relationships. Border widths and focus outlines are optical exceptions.

Controls use a 6px radius (`--radius-control`); panels use 8px (`--radius-panel`). Cards have a 1px border and no default shadow. Do not use shadow or enlarged radii to establish hierarchy: use spacing, headings, surface placement, and content order.

## Layout conventions

- **Application shell:** persistent left sidebar on desktop; header contains location and theme control. Active navigation uses a navy left edge, tinted background, stronger text, and `aria-current`. Keep demo/data limitations visible without turning them into a large banner.
- **Dashboard:** a compact metric strip, one recommended lesson, topic rows, then activity and reviews. Do not repeat three cards for every section or add decorative progress rings.
- **Career paths:** readable comparison rows with a selection button and a separate selected-path summary. Subjects are plain text; topic links remain actionable.
- **Topic library:** two columns when workspace width permits, one on smaller screens. Reuse TopicCard; use the same component as rows in the dashboard's `topic-list` container.
- **Lessons:** `--reading-width` is 68ch. Keep objectives, explanations, examples, checks, and navigation in reading order. A narrow outline/reference rail supplements the article on wide screens.
- **Practice:** one dominant question panel with topic/format controls and a secondary visit summary. Keep answers and previous/next navigation together. Code exercises remain display-only.
- **Analytics:** a shared metric strip, labeled table, and the existing study-activity chart. Use the same single-color scale and units across Dashboard and Progress. Label sample data explicitly.
- **Settings:** a limited-width form with profile, study, and appearance sections. Keep labels above fields and feedback close to the submit action.
- **Authentication:** a narrow single-column form on a white surface, separate from the study sidebar. Reuse fields/buttons, explicit labels and autocomplete, inline validation, announced errors, and a disabled submit state while pending. Keep email-confirmation guidance and sign-in links clear.

## Component styling and interactive states

Use the existing Button variants (`default`, `outline`, `ghost`) and `asChild` for navigational links. Card is a quiet surface. Native Progress has a visible value/accessible label and uses the primary accent. Topic symbols use the same neutral surface and navy text across categories.

| State | Convention |
| --- | --- |
| Default | Clear text, modest border, consistent alignment |
| Hover | Solid surface or text-color change; text links underline |
| Keyboard focus | 3px primary outline with 3px offset; never suppress focus without an equivalent |
| Active/selected | Tinted surface and visible boundary plus native state or a text label |
| Disabled | Native `disabled`, reduced button opacity, no hover recoloring, no interaction; keep selected answer feedback readable |
| Loading | Plain status and optional static skeleton lines; no required animation |
| Empty | Explain the missing result and provide the existing reset/browse action |
| Error | Clear recovery copy and retry/back actions; never expose internal errors |
| Success/review | Written feedback, optional meaningful icon, and semantic border/surface; no color-only outcome |

## Accessibility standards

Target WCAG 2.2 AA. Normal text should meet 4.5:1 contrast; large text and meaningful control/graphic boundaries should meet 3:1. Check both themes. Passive card separators do not need to impersonate input boundaries.

Use native buttons, links, radio inputs, selects, progress elements, and the mobile `details` disclosure. Retain visible labels, the skip link, logical headings, table headers/caption, feedback announcements, and keyboard radio behavior. Controls generally use `--control-height` (48px); compact controls and standalone links have a minimum 44px target. Form fields use 16px text to stay readable on mobile.

Tables and code samples may scroll inside their own labeled containers; the whole page should not scroll horizontally. Charts include per-day text as well as visible values and labels. Honor `prefers-reduced-motion` by disabling transitions/animations. Automated axe checks complement keyboard, zoom, and visual review; they do not certify complete accessibility.

## Responsive behavior

- **Below 768px:** use the native mobile navigation; 16px page gutters; stack recommendations, path selection, lesson outline, and practice summary below their main content.
- **768–1199px:** use a 208px sidebar and 24px gutters. Collapse content columns to account for the sidebar's actual footprint.
- **1200px and above:** use a 240px sidebar, 32px gutters, and bounded content width (`--content-width`, 82rem). Reading and practice content retain narrower limits.
- Metrics become two columns below 960px. Secondary dashboard panels split only on wide workspaces. Do not force fixed card or control widths onto mobile.

Review representative layouts at 360px, 768px, and 1440px, along with dark mode, keyboard focus, loading/empty/error states, and increased text size. Preserve all existing routes, content, state lifetimes, and sample-data distinctions.

Run the configured lint, TypeScript, build, and Playwright checks after relevant changes. The browser suite supports `PLAYWRIGHT_CHANNEL=msedge` or `chrome` when that browser is already installed; otherwise use the normal Playwright Chromium installation. This avoids adding a browser download just for a styling task.

## Patterns to avoid

No purple/blue gradients, glow, decorative orbs, glassmorphism, default card shadows, sparkle/magic icons, decorative imagery, unnecessary animation, excessive badges, or repetitive three-column grids. Do not add a UI package just to restyle an existing primitive. Choose a layout because it helps the learner's task, not because it resembles a generic dashboard template.
