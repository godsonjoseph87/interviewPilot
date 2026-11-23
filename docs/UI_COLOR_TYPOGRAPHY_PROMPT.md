# Prompt: Colour, Typography & "Premium Feel" Pass — InterviewPilot AI

> Paste everything below the line into a fresh Claude Code session at the repo root.

---

You are a senior brand and product designer working in code. InterviewPilot AI (React 18 + Vite + TS + Tailwind 3) already has a clean token system: CSS variables in `src/styles/globals.css` mapped in `tailwind.config.js`, plus primitives in `src/components/ui/`. The structure is fine. **The look still feels basic, and the colours don't work together.** Your job is to replace the palette and fonts and add the depth details that make it feel premium. **Do not change behaviour or app logic.**

## Why it currently looks off

- A champagne-gold accent on warm-stone greys, with the Fraunces serif, reads as muddy and "old luxury". That's the wrong mood for an AI tool built for technical interviews.
- The accent has nothing to pair with. Every surface is a flat neutral, so screens look like wireframes.
- There's no depth: no background atmosphere, no layered surfaces, no highlight edges. Cards are white boxes on off-white.
- The fonts don't pair well. Inter plus Fraunces is generic plus mismatched, and numbers like scores and timers get no special treatment.

## New identity: "Midnight Indigo"

The mood should be: **intelligent, calm, precise, a little futuristic.** Deep ink-navy surfaces, a confident indigo-violet primary, and a cool teal as the secondary "AI" colour. Dark mode is the showcase theme and should be the default. Light mode is a crisp, airy counterpart built from the same hues.

### Typography

| Role | Font | Usage |
|---|---|---|
| UI / body | **Geist** (400, 500, 600) | Everything by default. Tracking `-0.011em` on body and `-0.025em` on headings. |
| Display | **Geist** 600/700 at large sizes, tracking `-0.035em` | Page titles, report hero, big stats. |
| Editorial accent (optional, sparing) | **Instrument Serif** *italic* 400 | At most one or two highlighted words in hero headlines, e.g. "Run *sharper* interviews". Never for UI text. |
| Mono / numbers | **Geist Mono** (400, 500) | Code, timers, scores, IDs, keyboard hints. |

- Load all three from Google Fonts with `display=swap`. Remove Inter, Fraunces and JetBrains Mono from `index.html` and the Tailwind `fontFamily`.
- Set `font-sans: Geist`, `font-display: Geist`, `font-serif: Instrument Serif`, `font-mono: Geist Mono`.
- Apply `font-variant-numeric: tabular-nums` globally to `.font-mono`, stats, scores, timers and table number columns.
- Type scale (keep the existing token names and update the values): display 44/48, h1 32/38, h2 24/30, h3 18/26, body 15/24, small 13/20, caption 12/16. Nothing below 12px.

### Colour tokens: replace the values in `globals.css`

Keep every existing variable name. Add `--accent-2*` and `--glow`, and map them in `tailwind.config.js`.

**Dark (default):**

```css
--background: 234 33% 6%;        /* #0A0B14 ink */
--foreground: 230 45% 94%;       /* #E8EAF5 */
--surface: 232 32% 9%;           /* #10121F */
--surface-raised: 232 30% 13%;   /* #171A2B */
--card: 232 32% 9%;
--card-foreground: 230 45% 94%;
--popover: 232 30% 14%;
--popover-foreground: 230 45% 94%;

--primary: 248 100% 68%;         /* #6E5BFF indigo-violet */
--primary-hover: 248 100% 73%;
--primary-foreground: 0 0% 100%;
--primary-subtle: 247 60% 15%;
--primary-border: 247 50% 32%;

--accent-2: 171 77% 58%;         /* #4FE3CC teal — AI/live elements only */
--accent-2-subtle: 171 50% 12%;
--accent-2-border: 171 45% 26%;

--secondary: 232 26% 15%;
--secondary-foreground: 230 45% 94%;
--muted: 232 26% 14%;
--muted-foreground: 230 20% 66%;   /* #9399B8 */
--subtle-foreground: 230 15% 47%;  /* #636987 */
--border: 232 25% 17%;             /* #22253A */
--border-strong: 233 24% 25%;
--input: 232 25% 17%;
--ring: 248 100% 68%;
--glow: 248 100% 68%;

--success: 158 64% 52%;  --success-foreground: 152 76% 88%; --success-subtle: 158 45% 11%; --success-border: 158 40% 24%;
--warning: 43 96% 56%;   --warning-foreground: 45 93% 86%;  --warning-subtle: 40 50% 11%;  --warning-border: 40 45% 26%;
--danger: 351 95% 71%;   --danger-foreground: 355 100% 91%; --danger-subtle: 350 45% 12%;  --danger-border: 350 40% 28%;
--info: 213 94% 68%;     --info-foreground: 214 95% 91%;    --info-subtle: 215 45% 12%;    --info-border: 215 40% 28%;

--chart-1: 248 100% 70%;  /* indigo */
--chart-2: 171 77% 55%;   /* teal */
--chart-3: 43 96% 60%;    /* amber */
--chart-4: 330 85% 70%;   /* pink */
--chart-5: 205 90% 65%;   /* sky */
```

**Light:**

```css
--background: 228 45% 98%;       /* #F7F8FC */
--foreground: 231 39% 10%;       /* #0F1222 */
--surface: 0 0% 100%;
--surface-raised: 228 45% 96%;   /* #F0F2F9 */
--card: 0 0% 100%;
--card-foreground: 231 39% 10%;
--popover: 0 0% 100%;
--popover-foreground: 231 39% 10%;

--primary: 246 85% 60%;          /* #5544F0 */
--primary-hover: 246 72% 53%;
--primary-foreground: 0 0% 100%;
--primary-subtle: 244 89% 96%;
--primary-border: 246 85% 89%;

--accent-2: 175 84% 30%;         /* #0C8C80 teal */
--accent-2-subtle: 170 70% 95%;
--accent-2-border: 172 55% 80%;

--secondary: 228 40% 95%;
--secondary-foreground: 231 39% 14%;
--muted: 228 40% 95%;
--muted-foreground: 230 17% 42%;
--subtle-foreground: 229 16% 60%;
--border: 227 27% 91%;           /* #E2E5F0 */
--border-strong: 226 26% 84%;
--input: 227 27% 88%;
--ring: 246 85% 60%;
--glow: 246 85% 60%;

--success: 161 94% 30%;  --success-foreground: 163 88% 18%; --success-subtle: 152 76% 95%; --success-border: 154 60% 82%;
--warning: 32 95% 44%;   --warning-foreground: 26 90% 25%;  --warning-subtle: 48 100% 95%; --warning-border: 45 90% 80%;
--danger: 347 77% 50%;   --danger-foreground: 345 80% 28%;  --danger-subtle: 356 100% 97%; --danger-border: 353 90% 88%;
--info: 221 83% 53%;     --info-foreground: 224 76% 30%;    --info-subtle: 214 100% 97%;   --info-border: 213 90% 87%;

--chart-1: 246 85% 60%;
--chart-2: 175 84% 34%;
--chart-3: 38 92% 50%;
--chart-4: 330 80% 58%;
--chart-5: 205 85% 50%;
```

**Colour roles (follow strictly):**

- **Indigo (primary):** primary buttons, active nav or tab, focus rings, selected states, links, the main chart series. Use it for less than 10% of any screen.
- **Teal (accent-2):** only for AI and "live" things: copilot probes, AI-generated badges, the live-session dot, the AI-status indicator, streaming text cursors. This colour pairing is the product's signature.
- **Neutrals:** everything else. Semantic colours are only for meaning (hire/no-hire, scores, errors), never decoration.
- **Score scale:** ≥80 success, 60–79 info, 40–59 warning, <40 danger. Apply it the same way in ScoreBadge, report, history and charts.

## Make it feel premium, not basic (signature details)

Add these as reusable utilities or components in `globals.css` / `tailwind.config.js`. Don't scatter them as one-offs.

1. **Ambient background:** fix a subtle layer behind the app: two very soft radial glows (indigo top-left about 12% opacity, teal top-right about 6% in dark; about half that in light), plus a faint dot or grid pattern masked to fade out. Keep it barely noticeable.
2. **Layered surfaces:** cards use `bg-card` + a 1px `border` + an **inner top highlight** (`box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.04)` in dark) + a soft neutral drop shadow in light. Raised elements (popovers, modals, dropdowns) sit one step lighter, with `backdrop-blur` and the overlay shadow.
3. **Glass header:** the sticky navbar uses `bg-background/70 backdrop-blur-xl` with a bottom hairline. The active nav item is an indigo-subtle pill with an indigo text colour.
4. **Primary button:** solid indigo, a subtle top-to-bottom sheen (`linear-gradient(to bottom, hsl(0 0% 100% / .12), transparent)` overlay), a 1px inner highlight, and on hover a soft `--glow` shadow (`0 0 0 4px hsl(var(--glow)/.15), 0 8px 24px -6px hsl(var(--glow)/.5)`). No multi-colour gradients.
5. **AI gradient border:** an `.ai-surface` utility. A 1px gradient border from indigo to teal (via `mask` or `background-clip`). Use it **only** on the copilot probes panel, the AI summary card in the report, and the API-key modal header.
6. **Icon chips:** section and stat icons sit in a 32–36px rounded-lg chip with a tinted background (`primary-subtle` or `accent-2-subtle` or a semantic subtle colour) and a matching icon colour.
7. **Hero typography:** dashboard and report heroes get the display size, with an eyebrow label (caption, uppercase, `tracking-[0.12em]`, `muted-foreground`), and optionally one Instrument Serif italic word in a subtle indigo→teal gradient text.
8. **Data styling:** big numbers in Geist 600 with tabular figures. Score rings or bars use the score scale. Charts get rounded bars, an area gradient fill (series colour fading from 35% to 0%), dashed gridlines in `--border` and a popover-styled tooltip.
9. **States:** skeleton loaders shimmer in `surface-raised`. Empty states get a small illustration made of icon chips plus a short, friendly line of copy. Hover on interactive rows and cards is a `surface-raised` background, a `border-strong` border and a 1px lift. Focus is a 2px ring in `--ring` with an offset matching the background.
10. **Motion:** 160–220ms `cubic-bezier(.2,.8,.2,1)`. Page content rises in with a 30ms stagger per section. The live dot pings softly in teal. Respect `prefers-reduced-motion`.

## Rules

- Change token values and add utilities. Components should keep using token classes (`bg-primary`, `text-muted-foreground`, …). Only touch components where they need the new signature details or currently hardcode something.
- No raw Tailwind palette classes or hex values outside `globals.css` / `tailwind.config.js`. No `!important`.
- **Contrast:** check every text/background token pair against WCAG AA (4.5:1 body, 3:1 large text and UI) with a small script, in both themes. If `primary` with `primary-foreground` fails in dark mode, nudge the primary lightness down by 2–4% until it passes. Report the final ratios in a table.
- Update the Recharts theme helper (`src/lib/chartTheme.ts` or equivalent) to read the new chart tokens.
- Set dark as the default theme for first-time users, without a flash of the wrong theme on load.

## Process

1. Read `globals.css`, `tailwind.config.js`, `index.html`, `components/ui/*` and the chart helper. Briefly confirm the plan.
2. Apply fonts → tokens → signature utilities → primitive tweaks (Button, Card, Badge, Modal, Navbar) → per-screen touches (Login hero, Dashboard hero and stats, Workspace copilot/live panel, Report hero and charts).
3. Run `npm run build`. Launch the app and **screenshot Login, Dashboard, New Interview, Workspace, Report, History and Settings in both dark and light**. Review them critically: does every screen share the same mood? Is indigo used sparingly, and teal only for AI? Iterate until yes.
4. Finish with the contrast table and a short before/after summary.

### Optional alternates (only if I ask to switch)

- **"Evergreen & Brass":** bg `#0B1210`, surface `#111A17`, primary `#D4A657` brass, accent-2 `#6EE7B7` mint. Fonts: Instrument Sans + Instrument Serif + JetBrains Mono. Warmer and more editorial.
- **"Graphite & Coral":** bg `#0C0C0E`, surface `#141417`, primary `#FF6B5B` coral, accent-2 `#7DD3FC` sky. Fonts: Plus Jakarta Sans + Geist Mono. Energetic and friendly.
