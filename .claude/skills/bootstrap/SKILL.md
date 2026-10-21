---
name: bootstrap
description: Set up a new design-system project from the starter kit in this folder — project settings, brand palette from Claude Design, install, full verification, first commit, running canvas. Run once per project.
disable-model-invocation: true
argument-hint: "[optional: link to the brand's design or design system in Claude, or path to an export]"
---

# Bootstrap a new design-system project

The person running this is a **designer**, not a developer. Do every technical step yourself, explain
results in plain words, keep logs out of your messages, and talk to them in the language they write in.
Don't create screens or new components here — this command only prepares the project.

Brand source passed as an argument (may be empty): $ARGUMENTS

## 0. Preflight

1. Confirm the starter is in the current folder: `AGENTS.md`, `.claude/rules/`, `package.json`,
   `src/styles/tokens.css`, `src/project.json`. If anything is missing, stop and tell them to unzip the
   starter kit into this folder (hidden `.claude` folder included).
2. Check `node -v` (must be 20.19 or newer) and `git --version`. If either is missing or too old, stop and
   tell them what to install: Node.js LTS from https://nodejs.org and Git from https://git-scm.com.
3. If `src/project.json` already has `product`, `locale` and `currency` set, this project was bootstrapped
   before. Ask whether to re-apply the brand and re-run the checks, or stop. Never overwrite their work in
   `src/pages`, `src/data` or `src/components`.

## 1. Ask for the project settings — one round of questions

Use AskUserQuestion when available (otherwise one short message), with these defaults:

1. **Product name** — free text.
2. **Interface language** — the language of all text inside the product (buttons, labels, data), not the
   language we talk in: `en-US`, `ru-RU`, `uk-UA`, other. Don't assume it from the language they write to you in.
3. **Other locales** — none (default) or a list.
4. **Currency** — `RUB`, `UAH`, `USD`, `EUR`.
5. **Brand** — from Claude Design: a link to the brand's design system or a design in Claude (or the link in the
   argument above), or an export in `design-import/`; or keep the placeholder palette for now. A link: read it
   with the Artifact tool — a design system's `project/README.md` and `project/tokens.json`, a design's
   `project/canvas.json` and its artboards — and save what you read into `design-import/<today>/` with a
   `source.txt` holding the link. If they used Claude Design's handoff to Claude Code, follow its instructions to
   read the design. Either way, apply it only as described in step 3.
6. **Font** — Inter (default) or another family.

## 2. Write the settings

Update `src/project.json`: `product`, `locale`, `otherLocales`, `currency`, `font`. Keep `density`,
`viewports` and `referenceDate` unless they asked otherwise. Nothing else stores these values.

If the interface language differs from the language of the conversation, say it once in plain words, for
example: «Общаемся по-русски, интерфейс будет на английском». From now on every UI string you write
(templates, fixtures, statuses, glossary) is in the interface language. The sample text on the starter's
matrix pages switches automatically (`src/layouts/sample-copy.json`); if the language is missing there, add it.

## 3. Apply the brand (skip if they chose the placeholder)

Read the brand source (a design system's tokens and README; or the HTML, CSS, notes and screenshots of a design).
Extract the primary brand color, the neutral (gray) tint, status colors if defined, the font family and the
corner-radius style. A design system's `tokens.json` gives exact values — prefer it over reading colors off a design.

- Edit **only** section 1 (palette) of `src/styles/tokens.css`. Keep every `--palette-*` name; change values.
  Brand primary → `--palette-primary-600`; derive 50 / 400 / 700 / 800 / 950 in OKLCH with the same hue,
  following the lightness ladder of the placeholder values. Do the same for neutrals if the brand gray is tinted.
- Never rename semantic tokens or change their mapping in sections 2 and 3. The only edits allowed there are
  `--font-sans` and the radius overrides below.
- Font other than Inter: `npm install -D @fontsource-variable/<font>` (or `@fontsource/<font>`), replace the
  Inter `@import` in `tokens.css`, update `--font-sans`. Make sure the package has the locale's script
  (Cyrillic for `ru-RU` / `uk-UA`).
- Clearly sharper or rounder brand: override `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` in
  the `@theme` block, keeping their order.
- Run `node scripts/contrast.js`. If a pair fails, adjust the lightness of that palette step (not the token
  mapping) and re-run until all pairs pass.
- Remember a short table for the final message: brand value → palette step → any adjustment for contrast.

## 4. Install and verify

1. `npm install`
2. `npx playwright install chromium` — a one-time download (about 150 MB); tell them it can take a minute.
3. `npm run check`, `npm run lint`, `npm run build`, `npm run test:a11y` — all must pass.
   If something fails, fix the cause (usually a palette step) and re-run. Never weaken a rule, add
   `eslint-disable`, or skip a test to get green.

## 5. Git

If the folder is not a git repository: `git init`. Then `git add -A` and
`git commit -m "Bootstrap <product> design system"`. Don't add remotes or push unless they ask.

## 6. Start the canvas and hand over

Start `npm run dev` in the background and wait until it answers at http://localhost:5173.

Final message — short, in their language:

- What was set: product, language, currency, font, brand (applied or placeholder) with the palette table.
- The canvas address: http://localhost:5173 — five reference components are already there.
- The main way to work from now on: keep designing in Claude Design; to bring a design in, run
  `/import-design` with the design's link (or put an export into `design-import/` and run it without one). If the
  brand source of this bootstrap contains screens, offer to run `/import-design` right now.
- Offer `/publish-design-system`: it publishes this system to Claude Design, so new designs there start from the
  project's tokens and components.
- Other things they can ask, as ready-to-copy prompts (translate them into their language):
  1. «Create the missing base components from components.md §8, one at a time, each with its matrix page.»
  2. «Create the data contract for <entity> with fields: …»
  3. «Create the <flow> flow: a list with its data states, a details drawer, …»
- How to approve: set `"status": "approved"` on a frame in `src/canvas.json`, then run `npm run approve:visual`
  to record its baseline screenshots.
