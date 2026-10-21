---
paths:
  - "src/pages/**"
  - "src/canvas.json"
---

# Screens and the canvas

A screen is a page template that composes registered components and renders fixture data. Each screen is a
frame on the canvas; a screen with data also declares its data states, and each state is rendered separately.

## 1. Page structure

```njk
{% extends "layouts/frame.njk" %}
{% from "components/ui/button/button.njk" import button %}
{% from "components/pattern/data-table/data-table.njk" import dataTable %}
{% block body %}
<main class="flex flex-col gap-6 p-6">
  <div class="flex items-center justify-between gap-4"><h1 class="text-2xl font-semibold tracking-tight text-fg">Сделки</h1>{{ button("Создать сделку", iconLeading="plus") }}</div>
  {{ dataTable(data.views.deal.list, data.fixtures.deal.scenarios[scenario], state=state) }}
</main>
{% endblock %}
```

- Template context for every frame: `frame` (its `canvas.json` entry), `flow`, `state`, `scenario`, plus the
  globals `data`, `project`, `variants`, `icon`.
- `AppShell` → `PageHeader` (one `<h1>`, primary action top-right) → content inside `<main>`.
- Headings in order (`h1` → `h2` → `h3`), landmarks: `header`, `nav`, `main`, `aside`.
- Only registered components and layout utilities (`flex`, `grid`, `gap-*`, padding, widths). If you need a
  new visual pattern, register a component first (`components.md`).
- Data comes from `src/data/fixtures/` — loop over fixture records; never type names or numbers into markup.

## 2. Data states — only where there is data

Data states apply to views that show data: tables, lists, boards, calendars, timelines, chart widgets,
data-bound forms. Screens without data (sign-in, settings, static pages) declare none.

| State | When | Must show |
|---|---|---|
| `default` | normal data | realistic data with every column, badge, action and pagination |
| `loading` | first fetch | skeleton with the exact layout of the content (same rows, columns, card sizes); container `aria-busy="true"` and a visually hidden «Загрузка…»; blocks `bg-skeleton motion-safe:animate-pulse`. No centered spinner. |
| `empty` | nothing created yet | icon, title, one sentence on what this area is for, primary action («Создать первую сделку») |
| `no-results` | filters or search return nothing | what was searched, the active filter chips, action «Сбросить фильтры». Never a «Create» action here. |
| `error` | request failed | what happened and what to do, action «Повторить»; keep the page chrome and filters visible |
| `stress` | edge-case data | the `default` view with long strings, large numbers, missing values and 200+ records |

- **Where the states live.** The component that shows the data (`DataTable`, `KanbanBoard`, `CalendarGrid`)
  implements them and declares them in `components.json` → `dataStates`. The screen passes `state` to it
  and declares in `canvas.json` → `states` only the states that change the page.
- **How to render them.** The build renders the page once per declared state and passes `state` and
  `scenario` — see the table below. Branch on `state`; for `stress` nothing to do, the data changes.
- Errors inside a default view (one widget failed, one row failed to save) are shown inline at that place,
  not by replacing the whole page.

| Tab | `state` | `scenario` |
|---|---|---|
| Default | `default` | the frame's `scenario` (default `typical`) |
| Loading | `loading` | same |
| Empty | `empty` | `empty` |
| No results | `no-results` | `empty` |
| Error | `error` | same |
| Stress | `default` | `stress` = `longStrings` + `largeNumbers` + `partial` + `many` |

`npm run check` fails if a declared state renders exactly like `default` — that means the template ignores it.

No lorem ipsum, no «Test 1», no `0,00 ₽` placeholders. Long names must wrap or truncate deliberately
(`truncate` + full text in `title` or a tooltip), never overflow — the Stress tab shows whether they do.

## 3. Responsive

- Every screen exists at 1440 px and 390 px (`viewports`), in light and dark.
- Breakpoints are viewport-based (`md:`, `lg:`) as in production. Frames are iframes of fixed width, so
  breakpoints react to the frame — don't switch to container queries to fake it.
- Tables on mobile: choose explicitly and annotate the table root — `data-mobile-view="cards"` (rows become
  cards) or `data-mobile-view="scroll"` (horizontal scroll inside the table container, sticky first column).
- At 320 px width nothing except a data table scrolls horizontally.
- Overlays on mobile: drawers become full width; modals become bottom sheets or full screen.

## 4. Frames — `src/canvas.json`

```json
{
  "flows": [
    {
      "id": "deals",
      "title": "Сделки",
      "frames": [
        { "id": "deals-list", "title": "Список сделок", "page": "pages/deals/list.njk", "states": ["loading", "empty", "no-results", "error", "stress"], "viewports": [1440, 390], "status": "review" },
        { "id": "deals-drawer", "title": "Карточка сделки", "page": "pages/deals/drawer.njk", "states": ["loading", "error", "stress"], "viewports": [1440, 390], "status": "draft" },
        { "id": "sign-in", "title": "Вход", "page": "pages/auth/sign-in.njk", "viewports": [1440, 390], "status": "draft" }
      ]
    }
  ]
}
```

- `states` lists extra states besides `default`; leave it out for screens without data. The canvas shows
  tabs only on frames that have them. Files: `/frames/<id>.html`, `/frames/<id>--<state>.html`.
- Optional `scenario` (default fixture scenario) and `height` (px, when the screen needs more than 900
  desktop / 844 mobile).
- Order frames inside a flow along the user journey: list → filtered → details → action → result. The
  canvas sidebar lists them in this order.
- `status`: `draft` → `review` → `approved` → `deprecated`. Only a person sets `approved`.
- An approved frame has baseline screenshots for every state. Changing it fails the visual test until it is
  re-approved, so change approved frames only when the task asks, and list them in your reply.
