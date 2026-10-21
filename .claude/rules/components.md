---
paths:
  - "src/components/**"
  - "src/components.json"
---

# Components

A component has exactly one source. Pages call its macro; Nuxt receives its variants map unchanged.

## 1. Files

```text
src/components/ui/button/
├── button.njk            # macro: parameters = props, caller() = default slot
├── button.variants.json  # base + variants + sizes as full class strings (cva shape)
└── button.matrix.njk     # every variant × size × state, light and dark
```

## 2. Registry — `src/components.json`

Register before writing markup. Name = Vue SFC name. Status: `draft` → `review` → `approved` → `deprecated`.

```json
{
  "BaseButton": {
    "description": "Triggers an action: one primary per view, secondary for the rest, ghost in toolbars, danger only for destructive actions.",
    "category": "ui",
    "path": "src/components/ui/button",
    "variants": { "variant": ["primary", "secondary", "ghost", "danger"], "size": ["sm", "md", "lg"] },
    "slots": ["default"],
    "props": ["label", "variant", "size", "type", "disabled", "loading", "iconLeading", "iconTrailing"],
    "states": ["default", "hover", "focus", "active", "disabled", "loading"],
    "reka": null,
    "status": "approved"
  },
  "DataTable": {
    "description": "Lists records with sorting, selection and row actions; shows loading, empty, no-results and error states.",
    "category": "pattern",
    "path": "src/components/pattern/data-table",
    "variants": { "density": ["comfortable", "compact"] },
    "slots": ["toolbar", "empty"],
    "props": ["view", "records", "state", "density"],
    "states": ["default", "hover", "focus", "selected"],
    "dataStates": ["loading", "empty", "no-results", "error", "stress"],
    "reka": null,
    "status": "draft"
  }
}
```

- `description` — one sentence: what it is for and when to use it. It becomes the component's summary in the
  design system published to Claude Design (`/publish-design-system`).
- `states` — interaction states (hover, focus, disabled…), shown side by side on the matrix page.
- `dataStates` — only for components that show data (§6). Leave it out for buttons, inputs, badges.

## 3. Variants map — `<name>.variants.json`

Same shape as `cva(base, { variants, defaultVariants })`, so Nuxt imports it as-is.

```json
{
  "base": "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress",
  "variants": {
    "variant": {
      "primary": "bg-primary text-on-primary shadow-xs hover:bg-primary-hover active:bg-primary-active",
      "secondary": "border border-control bg-surface text-fg shadow-xs hover:bg-surface-subtle active:bg-surface-subtle",
      "ghost": "text-fg-secondary hover:bg-surface-subtle hover:text-fg active:bg-surface-subtle",
      "danger": "bg-danger-solid text-on-danger shadow-xs hover:bg-danger-solid-hover active:bg-danger-solid-hover"
    },
    "size": {
      "sm": "h-8 px-3 pointer-coarse:h-11",
      "md": "h-9 px-4 pointer-coarse:h-11",
      "lg": "h-10 px-5 pointer-coarse:h-12"
    }
  },
  "defaultVariants": { "variant": "primary", "size": "md" }
}
```

- Every visual decision lives here. A page never adds colors, borders or padding to a component.
- Every `hover:` has an `active:` partner; every interactive base has the focus classes.

## 4. Macro — `<name>.njk`

Template globals: `variants` (every variants map, keyed by file name in camelCase: `variants.button`,
`variants.iconButton`), `icon(name, classes)` (Lucide, returns inline SVG with `aria-hidden`), `data`
(everything in `src/data`), `project` (`src/project.json`). Reference implementations ship with the starter:
`BaseButton`, `BaseIconButton`, `BaseBadge` (+ `statusBadge`), `BaseInput`, `FormField` — copy their structure.

```njk
{% macro button(label="", variant="primary", size="md", type="button", disabled=false, loading=false, iconLeading=null, layout="") %}
{%- set v = variants.button -%}
<button type="{{ type }}" data-component="BaseButton" data-variant="{{ variant }}" data-size="{{ size }}" class="{{ (v.base ~ " " ~ v.variants.variant[variant] ~ " " ~ v.variants.size[size] ~ " " ~ layout) | trim }}"{% if disabled %} disabled{% endif %}{% if loading %} aria-busy="true"{% endif %}>
  {%- if iconLeading %}{{ icon(iconLeading, "size-4") }}{% endif -%}
  {%- if caller %}{{ caller() }}{% else %}<span>{{ label }}</span>{% endif -%}
</button>
{%- endmacro %}
```

```njk
{% from "components/ui/button/button.njk" import button %}
{{ button("Создать сделку", iconLeading="plus") }}
{% call button(variant="secondary", size="sm") %}{{ icon("download", "size-4") }}<span>Экспорт</span>{% endcall %}
```

Matrix pages extend `layouts/matrix.njk`, set `description`, and lay cells out with `section()` and `cell()` from
`layouts/_matrix-macros.njk`. Every `*.matrix.njk` appears on the canvas under «Components» automatically.

- Parameters map 1:1 to Vue props; `caller()` is the default slot; named slots are parameters with the slot
  name and `data-slot="<name>"` on their wrapper.
- `layout` accepts layout utilities only: margins, width, `flex-*`, `grid` placement, `self-*`. Never colors,
  borders, padding or typography.

## 5. Annotation attributes

| Attribute | Value |
|---|---|
| `data-component` | registry name, on the root element |
| `data-variant`, `data-size`, `data-tone` | the values used — must match the classes rendered |
| `data-slot` | `icon-leading`, `icon-trailing`, `header`, `body`, `footer`, `actions`, `empty` |

## 6. States — use Reka UI and ARIA attributes

Show states by setting the attribute the real component will have; style them with variants. The class
string stays identical for every item, so it ports to Reka without edits.

| Element | Attribute | Style with |
|---|---|---|
| Dialog, drawer, popover, dropdown, select content, accordion item | `data-state="open"` / `"closed"` | `data-[state=open]:` |
| Checkbox, switch, radio | `data-state="checked"` / `"unchecked"` / `"indeterminate"` | `data-[state=checked]:` |
| Tab trigger | `data-state="active"` / `"inactive"` | `data-[state=active]:` |
| Menu / select / combobox item | `data-highlighted`, `data-disabled`, `data-state="checked"` | `data-highlighted:` |
| Invalid field | `aria-invalid="true"` | `aria-invalid:` |
| Loading region or button | `aria-busy="true"` | `aria-busy:` |
| Selected table row | `aria-selected="true"` | `aria-selected:` |

Hover and keyboard focus can't be set statically: check them by pointing and tabbing inside the frame.
Never add classes such as `is-hover` or `focused`.

### Data states — only for components that show data

Tables, lists, boards, calendars, timelines and chart widgets take a `state` parameter and render `default`,
`loading`, `empty`, `no-results`, `error` (meaning and content in `screens.md` §2). Declare the ones that
apply in `dataStates`; the build renders the matrix once per state, and the canvas shows tabs to switch.

```njk
{% macro dataTable(view, records, state="default", density="comfortable") %}
{% if state == "loading" %}…skeleton rows, aria-busy="true"…
{% elif state == "empty" %}…EmptyState with the create action…
{% elif state == "no-results" %}…EmptyState with «Сбросить фильтры»…
{% elif state == "error" %}…ErrorState with «Повторить»…
{% else %}…rows from records…{% endif %}
{% endmacro %}
```

The matrix page passes the build's context through: `{{ dataTable(data.views.deal.list,
data.fixtures.deal.scenarios[scenario], state=state) }}`. The Stress tab needs no code — it switches the data.

## 7. Reka UI boundary

| Primitive | Here (HTML) | In Nuxt (Reka UI) |
|---|---|---|
| Dialog, drawer | backdrop, panel, header, body, footer, close button; open state | focus trap, `Esc`, scroll lock, portal |
| Select, combobox | trigger, content, search, items in every state | keyboard navigation, typeahead, ARIA wiring |
| Dropdown menu | trigger, content, items, separators, shortcut hints | outside click, arrow keys, submenus |
| Tabs | list, triggers, active indicator, panels | roving tabindex, roles |
| Tooltip, popover | trigger and content with arrow | positioning, collision, delays |
| Toast | message, icon, action, dismiss | queue, timers, swipe |

Write semantic markup with the roles from WAI-ARIA APG, but no JavaScript and no custom state machines.

## 8. Base set for every project

| Group | Components |
|---|---|
| ui | `BaseButton`, `BaseIconButton`, `BaseInput`, `BaseTextarea`, `BaseSelect`, `BaseCombobox`, `BaseCheckbox`, `BaseRadio`, `BaseSwitch`, `BaseBadge`, `BaseAvatar`, `BaseKbd`, `BaseSkeleton`, `BaseTooltip`, `BaseTabs` |
| form | `FormField` (label + control + hint + error, wires `aria-describedby`), `FormSection` |
| layout | `AppShell` (sidebar + header + main), `PageHeader` (title, description, primary action on the right) |
| common | `FiltersToolbar`, `FilterChips`, `PaginationControls`, `BulkActionBar`, `EmptyState`, `ErrorState`, `StatCard`, `Breadcrumbs` |
| overlay | `BaseModal`, `ConfirmModal`, `BaseDrawer`, `BaseDropdown`, `BasePopover`, `ToastMessage`, `CommandPalette` |
| pattern | `DataTable`, `KanbanBoard`, `PipelineFunnel`, `CalendarGrid`, `ActivityTimeline`, `StepWizard` |

`BaseIconButton` requires a `label` parameter that becomes `aria-label`. Build new components from these
before inventing alternatives.
