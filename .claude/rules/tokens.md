---
paths:
  - "src/**/*.{njk,html}"
  - "src/**/*.variants.json"
  - "src/styles/**"
---

# Tokens and Tailwind CSS v4

Every value in markup comes from a token or a scale step. Raw colors live only in `src/styles/tokens.css`.

## 1. Color tokens

Tailwind's default palette is removed (`--color-*: initial`), so `bg-slate-100`, `text-white` or
`bg-black/40` produce no CSS. Use these utilities:

| Role | Utilities | Use for |
|---|---|---|
| Page background | `bg-canvas` | `<body>` / app background |
| Surface | `bg-surface` | cards, tables, panels, inputs |
| Subtle surface | `bg-surface-subtle` | table header, secondary areas, hover on rows and ghost buttons |
| Overlay surface | `bg-surface-overlay` | menus, popovers, modals, drawers |
| Backdrop | `bg-backdrop` | behind modals and drawers |
| Skeleton | `bg-skeleton` | loading placeholders |
| Text | `text-fg` | headings, body, cell values |
| Secondary text | `text-fg-secondary` | labels, metadata, table headers |
| Muted text | `text-fg-muted` | placeholders, timestamps, hints |
| Divider | `border-divider`, `divide-divider` | decorative separators, card and table borders |
| Control border | `border-control` | inputs, checkboxes, radios, outline buttons |
| Primary | `bg-primary`, `hover:bg-primary-hover`, `active:bg-primary-active`, `text-on-primary` | primary buttons, selected controls |
| Primary text | `text-primary-fg` | links, active tab / nav text |
| Primary tint | `bg-primary-subtle` | selected row, active nav item |
| Focus | `outline-focus` | focus outline only |
| Destructive | `bg-danger-solid`, `hover:bg-danger-solid-hover`, `text-on-danger` | destructive buttons |
| Status tones | `bg-{tone}-bg`, `text-{tone}-fg`, `border-{tone}-border` | badges, alerts, inline messages |

Tones: `neutral`, `info`, `success`, `warning`, `danger`. Write the full class (`bg-success-bg`), never
`bg-${tone}-bg`. Badge class strings per tone live in one place: `variants.tone` of `badge.variants.json`.

Also allowed: `bg-transparent`, `text-current`, `bg-current`, `border-transparent`, `*-inherit`.

**Contrast is built in.** Every text token passes 4.5:1 on every surface in both themes; `control` and
`focus` pass 3:1. `npm run check` re-verifies all pairs from `tokens.css` (`node scripts/contrast.js` prints
the table). That holds only for these pairs — don't put `text-fg-muted` on `bg-primary` or on a tone
background; on a tone background use that tone's `-fg`.

## 2. Dark theme

- `.dark` on `<html>` switches token values; markup is identical in both themes. `dark:` is forbidden.
- In dark mode elevation comes from a lighter surface (`surface-overlay`) plus a `border-divider`, not
  from shadows. Give overlays both a shadow and a border so they work in both themes.

## 3. Spacing and sizes

Use only the classic scale: `0`, `px`, `0.5`, `1`, `1.5`, `2`, `2.5`, `3`, `3.5`, `4`, `5`, `6`, `7`, `8`,
`9`, `10`, `11`, `12`, `14`, `16`, `20`, `24`, `28`, `32`, `36`, `40`, `44`, `48`, `52`, `56`, `60`, `64`,
`72`, `80`, `96`. Tailwind v4 accepts any multiple (`p-13`, `w-81`) — those are still violations.

- Layout spacing (page padding, gaps between sections, cards, form rows): whole steps on the 4 px grid.
- Half steps (`0.5`, `1.5`, `2.5`, `3.5`) only inside compact components: badge, tag, kbd, menu item, input.
- Widths of text containers: `max-w-sm` … `max-w-7xl`, `max-w-prose`, fractions, `w-full`. Fixed widths
  only for columns and side panels.
- Square elements: `size-*` instead of `h-* w-*`.
- Full-height layouts: `h-dvh` / `min-h-dvh`, not `h-screen` or `calc(100vh - …)`.
- Never `space-x-*` / `space-y-*`: use `flex` or `grid` with `gap-*`.

## 4. Typography

| Role | Classes |
|---|---|
| Page title | `text-2xl font-semibold tracking-tight text-fg` |
| Section / card title | `text-lg font-semibold text-fg` |
| Body, inputs, table cells | `text-sm text-fg` |
| Labels | `text-sm font-medium text-fg` |
| Metadata, badges, hints | `text-xs font-medium text-fg-secondary` or `text-xs text-fg-muted` |
| KPI numbers | `text-3xl font-semibold tabular-nums text-fg` |

- Minimum size is `text-xs` (12 px). Nothing smaller, including `<kbd>`.
- Numbers, money, dates and IDs in columns: `tabular-nums`.
- Weights: `font-normal`, `font-medium`, `font-semibold`. `font-bold` only for KPI numbers.

## 5. Radius and shadow

| Element | Radius | Shadow |
|---|---|---|
| Badge, tag, kbd | `rounded-sm` | — |
| Button, input, menu item | `rounded-md` | `shadow-xs` on solid / outline buttons |
| Card, table container, popover | `rounded-lg` | card: none or `shadow-xs`; popover: `shadow-lg` |
| Modal, drawer panel | `rounded-xl` (drawer: none) | `shadow-xl` |
| Avatar, status dot, round icon button | `rounded-full` | — |

## 6. Icons

- Lucide, inline SVG with `stroke="currentColor"`; color comes from a text token on the icon or parent.
- Sizes: `size-4` (16 px, inside buttons and inputs), `size-5` (20 px, toolbars), `size-6` (24 px, empty states).
- Decorative icons: `aria-hidden="true"`. Icon-only buttons: `aria-label` on the button.
- Meaningful standalone icons need 3:1 contrast. Any text token passes (`text-fg-muted` included); the
  `opacity-*` utilities on icons do not — don't fade icons to make them quieter.

## 7. Tailwind v4 notes

- Renamed scales: `shadow-xs` (was `shadow-sm`), `rounded-sm` (was `rounded`), `rounded-xs` (was
  `rounded-sm`). Never use bare `rounded`, `shadow` or `blur`.
- Borders default to `currentColor`: always add a color (`border border-divider`).
- Focus: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`
  (inputs: `focus-visible:-outline-offset-1`). Don't use `outline-none` / `outline-hidden` without it.
- State variants: `data-[state=open]:`, `data-highlighted:`, `data-disabled:`, `aria-invalid:`,
  `aria-busy:`, `aria-selected:`, `disabled:`. Touch: `pointer-coarse:`. Motion: `motion-safe:`.
- No `!` important modifier. If you need it, the variants map is wrong — fix that instead.
