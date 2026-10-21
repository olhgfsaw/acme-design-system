# Design imports from Claude Design

Log written by `/import-design`. Newest first. One entry per import.

<!--
## 2026-10-21 — design-import/2026-10-21/
- Source: https://claude.ai/artifact/… (or the export file)
- Applied: …
- Snaps: `#3B82F6 → primary`, `13px → 3 (12px)` …
- Not applied: … (why)
- Frames: added …, changed … (approved: … — needs the client again)
-->

## 2026-10-21 — design-import/2026-10-21/
- Source: Acme design system https://claude.ai/artifact/KVDtSnxpyMvVjunsCp9tL9 (README, tokens.json, 25 component READMEs, index.d.ts, bundle.css). Brought in before the first publish so nothing live is lost.
- Applied:
  - Tokens: new accent group `accent`, `accent-strong`, `accent-subtle`, `on-accent` (Acme amber 400 / 600 / 200, on-amber); palette `accent-200…950`. Dark theme: primary flips to near-white with dark text, as in Acme.
  - Changed components (every use changes): BaseButton (pill, no shadow, sm 36 / md 48 / lg 56 px), BaseIconButton (round; new variants muted, surface, primary; `dot`), BaseBadge (tone `accent`, size `md`, `iconName`), BaseInput (variant `search`, size `lg`, `iconLeading`).
  - New components (draft): AppShell, TopBar, NavRail, PageHeader, BaseCard, StatBlock, AreaChart, GaugeChart, ChartLegend, LegendToggle, ProgressBar, MeterBar, CountdownTimer, ValueTag, IconTile, ProjectItem, BaseAvatar, AvatarStack, PromoCard, HelpCallout. Acme `Icon` = the `icon()` helper (all 27 icons are Lucide).
  - Renamed to multi-word Vue names: Card → BaseCard, Stat → StatBlock, Gauge → GaugeChart, Legend → ChartLegend, Countdown → CountdownTimer, Avatar → BaseAvatar.
- Snaps: type 40 → text-4xl (36), 32 → text-3xl (30), 56 → text-6xl (60), 13 → text-sm (14), 11 / 12.5 → text-xs (12); control-lg 54 → h-14 (56); toggle 34 → h-9 (36); meter bar 26 → h-7 (28); icon tile lg 58 → size-14 (56); radius 16 → rounded-md (12); search max width 608 → max-w-xl (576); avatar in stack 52 → size-12 (48); `surface-control-hover` #dedede → `divider`; `surface-control` #e9e9e9 → `surface-subtle`; `surface-muted` #f4f4f4 → `canvas` (meter bar and progress track → `surface-subtle` #e9e9e9, visible on dark cards); `chart-line` #cfcfcf → `control` (3:1 for a data line); `chart-area` → `canvas`; `neutral-fill` → `divider`; amber-500 / 300 gauge segments → `accent` / `accent-subtle`.
- Not applied:
  - Title Case → sentence case (AGENTS.md §2.5, designer's decision).
  - Promo gradient, `promo-glass`, chart tokens and soft success / danger fills — new tokens declined; PromoCard is a flat `accent-subtle` card with a white sheet, progress fills use the tone `-fg` colors.
  - Logo (raster crop) and the promo illustration — image files declined; TopBar shows the product name as text.
  - Outer app frame rim (`surface-page`, `surface-frame`, 44 px radius): device mock-up, not part of the app.
  - Gauge total sits under the arc, not inside it: text over the SVG can't be contrast-checked (axe).
  - Value tag on the chart is hidden below md; a tag above the chart shows the value instead (SVG text would shrink below 12 px).
  - ProjectItem shows the percentage or a status label next to the bar, so the tone never carries the state alone.
  - Brand book (voice, number formats, chart rules) is not published: the export script generates the README; extending it is a toolchain change that was not approved.
- Frames: added 20 component matrices; changed button, icon-button, badge, input matrices. No approved frames affected.
