# Design system repository — agent instructions

Pure HTML (Nunjucks templates) + Tailwind CSS v4, built with Vite. Clients and developers review components
and full screens on a canvas. Production target: Nuxt 4 + Vue 3.5 + Reka UI — markup must port 1:1.

Topic rules live in `.claude/rules/`. Claude Code loads them automatically by file path; other agents
(Antigravity, Cursor): read the matching file from the table in §7 before editing those paths.
New project? Run `/bootstrap` once (Claude Code) — it fills the settings, applies the brand and verifies everything.

## 1. Project settings — `src/project.json`

| Field | Meaning |
|---|---|
| `product` | product name shown on the canvas |
| `locale` | UI language and formats (`ru-RU`, `uk-UA`, `en-US`) — all UI copy, fixtures and labels in it |
| `otherLocales` | extra locales; layouts must fit the longest one |
| `currency` | default ISO 4217 code for `money` |
| `font`, `density`, `viewports` | project font, default table density, canvas widths (1440 and 390 by default) |
| `referenceDate` | "now" for fixtures and relative dates, so screenshots stay stable |
| `designSystem` | link to this system published in Claude Design (`/publish-design-system` sets it) |

If `product`, `locale` or `currency` is `null`, ask before generating screens (or suggest `/bootstrap`).
**Interface text is always in `locale`** — buttons, labels, fixtures, statuses, errors — whatever language you
talk to the designer in. Russian copy in the rule examples is only an illustration; translate it.
The brand palette lives in `src/styles/tokens.css` §1 — not in `project.json`.

## 2. Decisions — do not re-decide them

1. Components use **semantic tokens only** (`bg-surface`, `text-fg`, `border-control`). Raw palette values
   exist only in `tokens.css`. No `dark:` in markup — the theme switches token values.
2. **One source per component**: a Nunjucks macro + a `*.variants.json` map. Pages call macros; never copy
   component markup into a page.
3. **Design happens in Claude Design; the system lives here.** The designer works visually in Claude Design (inside
   Claude, where designs are artifacts) and brings every design in with `/import-design` — by link or export
   (normalize → reuse or register components → screens → checks). This repository owns tokens, component APIs,
   data states, accessibility and data contracts — an import never overrides them. `/publish-design-system` sends
   the system back to Claude Design, regenerated from this repository. Don't redesign screens here on your own;
   visual changes come from Claude Design.
4. **Target size**: at least 24×24 px with a mouse, 44×44 px on touch (`pointer-coarse:` variant).
5. **Sentence case** for all UI text: «Создать сделку», not «Создать Сделку».
6. **Component names = Vue SFC names** (`BaseButton`, `BaseModal`, `BaseDrawer`), the same everywhere.
7. **State attributes follow Reka UI and ARIA** (`data-state`, `data-highlighted`, `data-disabled`,
   `aria-invalid`, `aria-busy`); styles react to them with variants. No `is-*` / `--active` classes.
8. **No JavaScript in components or pages.** Interactive behavior (focus traps, keyboard, positioning) is
   implemented with Reka UI in Nuxt; here we show each state statically.

## 3. Hard rules — `npm run lint` / `npm run check` reject violations

- No palette classes (`bg-slate-100`, `text-white`, `bg-black/40`) — they are not generated; use tokens.
- No arbitrary values (`w-[327px]`, `text-[11px]`, `bg-[#f8fafc]`). Only exceptions: grid templates and
  `calc()`, each with a `{# why #}` comment. Attribute variants (`data-[state=open]:`) are fine.
- Spacing and sizes only from the classic scale listed in `tokens.md` (`p-13`, `w-81`, `gap-7.5` are invalid).
- No `dark:`, no `space-x-*` / `space-y-*` (use `flex` / `grid` + `gap-*`), no inline `style`, no `<style>`.
- Class names are always full literal strings. Never build them from data (`bg-${tone}-bg`).
- Every interactive element: visible focus (`focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-focus`), an accessible name, `type` on every `<button>`.
- Every `data-component` exists in `src/components.json`; `data-variant` / `data-size` / `data-tone` use listed values.
- Fixtures validate against their schemas; every status code exists in `statuses.json` and the schema enum.
- Do not change token colors to "fix" contrast — tokens already meet WCAG 2.2 AA. Ask instead.

## 4. Workflow

Order of work: tokens → primitives → composites → patterns → screens.

**New component**
1. Register it in `src/components.json`: name, category, path, variants, slots, props, states, Reka
   primitive, status `draft`; components that show data also list their `dataStates`.
2. Write `<name>.variants.json` (base + variants as full class strings, `cva` shape).
3. Write the macro `<name>.njk`: parameters = props, `caller()` = default slot.
4. Write `<name>.matrix.njk` (extends `layouts/matrix.njk`): every variant × size × interaction state;
   pass `state` through for data states. It appears on the canvas automatically.

**New screen**
1. Compose only registered components plus layout utilities. A missing pattern → register a component first.
2. Take data from `src/data/fixtures/` — never type data into markup.
3. If it shows data, declare its data states (`states`) and branch on `state` — only where they apply
   (`screens.md` §2). Mobile and desktop.
4. Add the frame to `src/canvas.json` with status `draft`.

**Design update from Claude Design** → `/import-design` (`.claude/skills/import-design/SKILL.md`); it logs to `IMPORTS.md`.
**System changed (tokens, components, statuses)** → offer `/publish-design-system` so Claude Design picks it up.

**Approved frames** (`status: "approved"`) are the client's sign-off and have baseline screenshots. Change
them only when the task says so, and name every changed approved frame in your reply.

**Done means**: `npm run check` and `npm run lint` pass; for screens also `npm run test:a11y`.

## 5. Repository layout

```text
├── AGENTS.md · CLAUDE.md · README.md · IMPORTS.md (log of imports from Claude Design)
├── .claude/                      # rules/, skills/ (/bootstrap, /import-design, /publish-design-system), settings.json
├── design-import/                # designs read from Claude Design, one dated folder each — not in git
├── .design-system/               # GENERATED by `npm run design-system` for /publish-design-system — not in git
├── index.html · viewer/          # canvas viewer — a tool, design-system rules don't apply to it
├── build/                        # Nunjucks rendering + Vite plugin (toolchain)
├── scripts/                      # check.js, contrast.js, hook-lint.js, design-system-export.js
├── tests/                        # a11y.spec.js (axe), visual.spec.js (approved frames)
├── frames/                       # GENERATED: rendered HTML of every frame — never edit
└── src/
    ├── project.json              # project settings (§1)
    ├── styles/tokens.css         # palette → semantic tokens → dark theme; the only raw colors
    ├── layouts/                  # frame.njk (page shell), matrix.njk + _matrix-macros.njk
    ├── components/{ui,form,layout,common,overlay,pattern}/<name>/
    │   └── <name>.njk · <name>.variants.json · <name>.matrix.njk
    ├── pages/<flow>/             # screens: macros + fixtures
    ├── data/                     # schemas/, fixtures/, views/, statuses.json, glossary.json
    ├── components.json           # component registry
    └── canvas.json               # flows → frames (page, states, viewports, status)
```

## 6. Commands

| Command | Purpose |
|---|---|
| `npm run dev` | canvas with live reload at http://localhost:5173 |
| `npm run check` | settings, token contrast, data ↔ schemas, markup ↔ registry, every declared state differs |
| `npm run lint` | renders every frame, then ESLint (Tailwind classes, HTML, accessibility basics) |
| `npm run build` | production build of the canvas and all frames |
| `npm run test:a11y` | axe on every frame × state × viewport × theme (WCAG 2.2 AA) |
| `npm run test:visual` / `approve:visual` | compare / record screenshots of approved frames |
| `npm run verify` | check + lint + build + a11y — run before handing work over |
| `npm run design-system` | builds the files `/publish-design-system` sends to Claude Design (after `npm run build`) |

Never report a check as passed without running it. Lint errors point to files in `/frames`; fix the source.

## 7. Topic rules

| File | Loaded for | Covers |
|---|---|---|
| `tokens.md` | markup, variants, `tokens.css` | token list, spacing and type scales, radii, icons, v4 syntax |
| `components.md` | `src/components/**` | registry, variants map, macros, state attributes, Reka boundary, base set |
| `screens.md` | `src/pages/**`, `canvas.json` | template context, data states, responsive, frames and statuses |
| `a11y.md` | all markup | WCAG 2.2 AA: contrast, focus, target size, forms, dragging, motion |
| `ux.md` | components, pages | NN/g heuristics, timing, tables, forms, destructive actions and unsaved changes, overlays, copy |
| `patterns.md` | overlays, patterns, pages | drawer, modal, wizard, kanban, calendar, timeline, command palette, keys |
| `localization.md` | markup, data | locale, formatting filters, plurals, text expansion |
| `data-contract.md` | `src/data/**` | schemas, six fixture scenarios, views, statuses, API conventions |
