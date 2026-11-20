# Prompt: Complete UI Theme Revamp — InterviewPilot AI

> Paste everything below the line into a fresh Claude Code session at the repo root.

---

You are a senior product designer and design-systems engineer. Do a **complete visual revamp** of InterviewPilot AI, a React 18 + Vite + TypeScript + Tailwind 3 app (cva, clsx/tailwind-merge, lucide-react, Recharts, Zustand, Dexie). The goal is an interface that feels **elegant, calm, premium and consistent** on every screen, in both light and dark mode, the way a well-made tool like Linear, Vercel or Raycast does.

**Do not change behaviour.** Stores, services, AI calls, DB, scoring, routing and props stay as they are. This job is only about presentation: tokens, primitives, layout, typography, spacing, motion and visual polish.

## 1. What is wrong today (verified in the code)

Fix these at the root. Don't layer more patches on top.

1. **Dark mode is a pile of overrides.** `src/styles/globals.css` holds about 400 lines of `.dark .bg-amber-50 { … !important }` rules that turn hardcoded light classes into black and white. As a side effect, success, warning and error colours all disappear in dark mode, every `svg` is forced to white, and Recharts fills are overridden with `!important`. **Delete all of it.** Dark mode must come from CSS variables only.
2. **Design tokens exist but nobody uses them.** The code has 1,000+ raw palette classes (`border-amber-200` ×88, `bg-amber-50` ×72, `text-amber-600` ×72, `text-stone-950`, `bg-zinc-900`, `bg-rose-500`, `bg-emerald-500`, …) instead of `bg-card`, `text-muted-foreground` and so on. `success` and `warning` are hardcoded hex values in `tailwind.config.js`.
3. **Primitives get bypassed.** `WorkspacePage.tsx` and other files hand-roll long button class strings like `h-8 px-4 min-w-[125px] … border-amber-300/80 bg-white … dark:bg-zinc-900` instead of using `<Button variant size>`. The Navbar repeats the same tab-button markup four times.
4. **There is no type scale.** `text-[11px]` appears 84 times and `text-[10px]` 48 times. Headings jump between `text-xl`, `2xl`, `3xl` and `4xl` with `font-bold` or `font-extrabold` and no clear rule. Body text is often too small to read comfortably.
5. **Radius and elevation are inconsistent.** `rounded-md`, `lg`, `xl` and `2xl` are mixed at random. Shadows carry colour (`shadow-amber-500/20`, `shadow-emerald-600/30`), and Card adds `hover:shadow-md` to every card, including ones you can't click.
6. **The visual language looks dated.** Primary buttons use three-stop amber→yellow gradients with glowing shadows, and `animate-pulse` sits on the "Resume" CTA. Gold is spread everywhere, so nothing stands out.
7. **Small inconsistencies:** `index.html` hardcodes `class="dark"` and uses `selection:bg-cyan-500/20`, a colour that appears nowhere else. The Navbar uses `px-[10%]` instead of a container. Spacing values are ad hoc.

## 2. Design direction

**Theme name: "Quiet Precision".** Neutral, warm-graphite surfaces, a lot of whitespace, crisp 1px hairlines, restrained depth, and **one** refined accent used sparingly for primary actions, focus and key data. Elegance comes from restraint, rhythm and typography, not from gradients.

- **Accent:** keep the brand's gold, but refine it into a muted *champagne/brass* (roughly `hsl(38 70% 48%)` light / `hsl(40 65% 62%)` dark). Use it as a solid colour, not a gradient. If gold looks wrong once implemented, fall back to a deep indigo (`hsl(243 75% 59%)`). Pick one and use it everywhere.
- **Neutrals:** a warm-zinc ramp. Light: background `#FAFAF9`, cards white, hairlines `#E7E5E4`. Dark: background `#0B0B0C` (not pure black), surface `#141416`, raised `#1B1B1E`, hairlines at about `white/8%`.
- **Semantic colours keep working in both themes:** success (emerald), warning (amber), danger (rose), info (sky). Each gets a `DEFAULT`, `foreground`, `subtle` (tinted bg) and `border` token, tuned per theme. Hire/no-hire, score and status colours must stay legible in dark mode.
- **Typography:** `Inter` (or `Geist`) for UI with `font-feature-settings: "cv11","ss01"`, and `JetBrains Mono` for code. Optionally use a refined display face (e.g. `Instrument Serif` or `Fraunces`) **only** for the big page titles and the report hero, so the app gets an editorial touch. Use tight tracking on headings (`-0.02em`) and tabular numbers for scores and timers.
- **Motion:** 150–200ms ease-out on hover and press. Fade or rise in for panels and modals. No pulsing, no bouncing. Respect `prefers-reduced-motion`.

## 3. Build the design system first (single source of truth)

1. **`src/styles/globals.css`:** keep only `@tailwind` directives, the `:root` / `.dark` CSS variables, base element styles, scrollbar, selection, focus-visible and the reduced-motion rule. Define the variables as HSL triplets:
   `--background --foreground --surface --surface-raised --card --card-foreground --popover --muted --muted-foreground --subtle-foreground --border --border-strong --input --ring --primary --primary-foreground --primary-hover --primary-subtle --success(-foreground/-subtle/-border) --warning(…) --danger(…) --info(…) --chart-1…--chart-5 --radius`.
2. **`tailwind.config.js`:** map every variable to a Tailwind colour. Add:
   - A **type scale** (`text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-small`, `text-caption` with matched line-heights and tracking). **Nothing below 12px.**
   - A **radius scale**: `sm 6px`, `md 8px`, `lg 12px`, `xl 16px`. Controls use `md`, cards use `lg`, modals and hero panels use `xl`.
   - An **elevation scale**: `shadow-xs/sm/md/lg/overlay`, neutral only, softer in light and replaced by a hairline plus a subtle inner highlight in dark.
   - A `container` config (centred, `max-w-7xl`, responsive padding) to replace `px-[10%]`.
   - Keyframes `fade-in`, `rise-in`, `scale-in`.
3. **Rebuild primitives in `src/components/ui/`** with cva, tokens only and zero raw palette classes:
   - `Button`: variants `primary | secondary | outline | ghost | subtle | danger | success | link`; sizes `xs | sm | md | lg | icon | icon-sm`; `leftIcon` / `rightIcon` props; spinner; consistent focus ring.
   - `Card` (+ `interactive` variant, so only clickable cards lift on hover), `Badge` (semantic + `dot` option), `Input`, `Textarea`, `Select`, `Modal` (overlay blur, `rise-in`), `ProgressBar`.
   - Add the missing primitives the pages clearly need: `Tabs` / `SegmentedControl` (Navbar, settings, workspace panels), `Tooltip`, `Separator`, `Skeleton`, `EmptyState`, `PageHeader` (eyebrow, title, description, actions), `SectionHeader`, `Kbd`, `IconButton`, `Stat`.
4. **Common components** (`ScoreBadge`, `StatCard`, `RichMarkdown`, `ApiKeyModal`, `ErrorBoundary`) consume only primitives and tokens. `RichMarkdown` gets a proper prose style: readable measure, code blocks on `--surface-raised` in the mono font, and token-based syntax colours.
5. **Charts:** add a `chartTheme` helper (`src/lib/chartTheme.ts`) that reads `--chart-*`, `--border` and `--muted-foreground` from CSS variables, and pass it to Recharts through props, never through CSS `!important`. Use soft gridlines, rounded bar tops, and a custom tooltip styled like a popover.

## 4. Then restyle every screen with the system

Go through these one at a time. Replace every raw colour class with tokens or primitives, and every hand-rolled button with `<Button>`.

| Screen | Files | Intent |
|---|---|---|
| App shell / Navbar | `App.tsx`, `components/layout/Navbar.tsx` | Slim 56px translucent header with a bottom hairline. Logo mark plus wordmark. A segmented-control nav built from one mapped config array. A calm "Resume session" pill with a live dot instead of a pulsing button. Theme toggle, AI-status dot and avatar menu in a tidy right cluster. |
| Login | `features/auth/LoginPage.tsx` | Split or centred hero: a subtle grid or noise background with one soft radial accent glow, a display-font headline, a short value proposition and a clean auth card. Keep the Google Identity button container untouched (see commit f71755d). |
| Dashboard | `features/dashboard/DashboardPage.tsx` | `PageHeader` with greeting and primary CTA. A row of 4 stat tiles with tabular numerals. Recent-interviews list as clean rows with status badges. A thoughtful empty state. |
| New Interview | `features/configure/NewInterviewPage.tsx` | A step-like form with grouped sections, selectable option cards for role, level and topics, a sticky summary/CTA footer and clear validation states. |
| Workspace (most important) | `features/workspace/*`, `features/dsa/*` | Calm three-pane layout: question sidebar, main question, live context/copilot. Resizable-looking dividers, a compact toolbar with `<Button size="sm">`, a monospace timer with tabular nums, and distinct but quiet states for the active, answered and skipped question. The interviewer should be able to focus on the question for long stretches without visual fatigue. |
| Report | `features/report/ReportPage.tsx` | Editorial report hero: big score, recommendation badge, display-font candidate/role title. Charts in matching cards. Strengths and concerns as two balanced columns. Print-friendly spacing. |
| History | `features/history/HistoryPage.tsx` | Filter bar (search plus segmented filters) and a data-table-style list with hover rows, status badges and row actions in a menu. |
| Settings | `features/settings/SettingsPage.tsx` | Left section nav or stacked sections, each `SectionHeader` + description + controls laid out in label/control rows. The danger zone is clearly separated. |

Also update `index.html`: remove the hardcoded `class="dark"` and the cyan selection classes, and stop the theme from flashing on load by setting the class from stored settings in a tiny inline script.

## 5. Consistency rules (enforce while working)

- **No raw Tailwind palette colours in `src/features/**` or `src/components/**`.** No `amber-`, `stone-`, `zinc-`, `emerald-`, `rose-`, `yellow-`, `cyan-`, `gray-`, and no hex values. Only token classes. Raw palette values may appear only in `globals.css` / `tailwind.config.js`.
- **No `!important`.** No `.dark .some-utility` overrides. Use `dark:` utilities only in rare, justified cases.
- **No arbitrary values** (`text-[11px]`, `min-w-[125px]`, `px-[10%]`) unless there is a real layout reason, noted in a comment.
- Spacing on a 4px grid. Page padding, section gaps and card padding come from a small fixed set (e.g. card `p-5`/`p-6`, section gap `gap-6`/`gap-8`).
- Icons: lucide only, `size-4` inline / `size-5` in headers, `strokeWidth={1.75}`, coloured `text-muted-foreground` unless semantic.
- Accessibility: WCAG AA contrast in both themes, visible `focus-visible` rings, hit targets ≥ 32px, `aria-label`s on icon buttons.
- Responsive: comfortable at 1280–1600px (main use), usable down to 768px.

## 6. How to work

1. **Plan first.** Read `tailwind.config.js`, `globals.css`, `components/ui/*`, `components/common/*` and every file under `features/`. Write a short plan and the full token table (light and dark values), and show it to me before you edit code.
2. Implement in phases, verifying each one before moving on:
   - **A:** tokens + config + globals cleanup.
   - **B:** primitives and new components.
   - **C:** shell and Navbar.
   - **D–J:** one screen at a time, in the order above.
3. After each phase: run `npm run build` (it must pass type-checking), launch the app, and **screenshot the affected screens in both light and dark mode**. Check them against the rules in §5.
4. At the end, run these and show me the output. Both must return nothing outside the design-system files:
   ```bash
   grep -rnE '\b(bg|text|border|ring|from|to|via|fill|stroke|shadow)-(amber|stone|zinc|emerald|rose|yellow|cyan|gray|slate|red|green)-[0-9]' src/features src/components
   grep -rn '!important' src
   ```
5. Out of scope: `src/services/pdf/*` (jsPDF reports). List any colour constants there that should later be aligned with the new tokens.

Deliver a revamped app where any two screens side by side clearly belong to the same product. Use the same surfaces, the same type scale, the same buttons and the same accent, used with the same restraint.
