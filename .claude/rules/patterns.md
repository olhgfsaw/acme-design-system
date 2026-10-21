---
paths:
  - "src/components/overlay/**"
  - "src/components/pattern/**"
  - "src/pages/**"
---

# Patterns: overlays and complex views

Examples show rendered HTML. In templates, use the macros — `<!-- BaseButton … -->` marks where one goes.

## 1. Drawer — `BaseDrawer`

Flex column: the body scrolls and the footer never covers content. No `calc()`, no absolute footer.

```html
<div data-component="BaseDrawer" data-state="open" class="fixed inset-0 z-50 flex justify-end">
  <div class="absolute inset-0 bg-backdrop" aria-hidden="true"></div>
  <section role="dialog" aria-modal="true" aria-labelledby="drawer-title"
    class="relative flex h-dvh w-full max-w-xl flex-col border-l border-divider bg-surface-overlay shadow-xl">
    <header data-slot="header" class="flex shrink-0 items-start justify-between gap-4 border-b border-divider px-6 py-4">
      <div class="flex min-w-0 flex-col gap-1">
        <p class="text-xs font-medium text-fg-muted">Сделка № 1042</p>
        <h2 id="drawer-title" class="truncate text-lg font-semibold text-fg">Миграция CRM в облако</h2>
      </div>
      <!-- BaseIconButton variant="ghost" label="Закрыть" icon="x" -->
    </header>
    <div data-slot="body" class="flex flex-1 flex-col gap-6 overflow-y-auto p-6">…</div>
    <footer data-slot="footer" class="flex shrink-0 justify-end gap-3 border-t border-divider bg-surface-subtle px-6 py-3">
      <!-- BaseButton variant="secondary" «Отмена» --> <!-- BaseButton «Сохранить» -->
    </footer>
  </section>
</div>
```

On mobile the panel is full width (`max-w-xl` still applies, `w-full` fills 390 px).

Unsaved changes: closing (×, «Отмена», `Esc`, backdrop click) after edits opens the discard confirmation from
`ux.md` §5 on top of the drawer. Show it on the `BaseDrawer` matrix page as its own cell.

## 2. Modal — `BaseModal`, `ConfirmModal`

Same anatomy as the drawer, centered: wrapper `fixed inset-0 z-50 flex items-center justify-center p-4`,
panel `flex max-h-full w-full max-w-xl flex-col rounded-xl border border-divider bg-surface-overlay shadow-xl`.
Footer actions right-aligned: secondary first, primary last. On mobile: panel `max-h-full` with a
scrolling body; long forms become a page instead of a modal.
Unsaved changes: the footer turns into an inline confirmation (`ux.md` §5) — «Закрыть без сохранения?» with
«Продолжить редактирование» and «Закрыть»; never a second modal. Show it as its own cell on the `BaseModal` matrix page.

## 3. Multi-step wizard — `StepWizard`

- Stepper on top: done steps with a check icon, current step `aria-current="step"`, pending steps muted.
  Step names are visible text, not only numbers.
- Sticky footer: «Назад» (secondary) on the left, «Далее: <следующий шаг>» (primary) on the right. «Далее»
  may be disabled until the step's required fields are filled; then a hint says which are missing.
- Closing with unsaved input asks the discard question from `ux.md` §5: «Закрыть импорт? Настройки не
  сохранятся.» — «Продолжить редактирование» / «Закрыть».
- Long operations (import) show progress with counts («Обработано 1 200 из 5 000») and «Отменить».

## 4. Kanban — `KanbanBoard`, `KanbanColumn`, `KanbanCard`

- Column header: name, count, sum (`tabular-nums`), WIP limit when set; over the limit → `warning` tone.
- Card: title, company or contact, amount, owner avatar, status badge. The card is a focusable `<article>`
  with `aria-labelledby` pointing at its title.
- Every card has a «Переместить в…» menu (`BaseDropdown` listing stages) — the non-drag alternative
  required by WCAG 2.5.7. Drag is an enhancement on top of it.
- Empty column: a dashed drop zone `rounded-md border-2 border-dashed border-divider` with «Перетащите сделку
  сюда или переместите её через меню карточки».
- Columns come from `views/<entity>.kanban.json`, which lists status codes only — labels and tones come
  from `statuses.json`.

## 5. Pipeline funnel — `PipelineFunnel`

Per stage: count, total amount, conversion to the next stage and the drop-off. Bar width proportional to
count. Values as text next to each bar, not only in a hover popover.

## 6. Calendar — `CalendarGrid`

- Header: month / week switch, previous / next, «Сегодня». Grid `grid grid-cols-7` with weekday headers.
- Day cell: date number (today: `bg-primary text-on-primary rounded-full`), up to 3 event pills, then
  «Ещё 2» (button opening a popover). Days outside the month use `text-fg-muted`.
- Week starts on the locale's first day (Monday for `ru-RU`).

## 7. Activity timeline — `ActivityTimeline`

Vertical line `border-l-2 border-divider`; each event has an icon in a round badge using a tone
(`bg-info-bg text-info-fg` for calls, `bg-warning-bg text-warning-fg` for stage changes, `bg-neutral-bg
text-neutral-fg` for notes), actor, action, time (`<time datetime>`). Grouped by «Сегодня», «Вчера», dates.

## 8. Command palette — `CommandPalette`

`⌘K` / `Ctrl+K`. A modal at the top third: search input, grouped results (navigation, actions, records),
shortcut hints on the right, highlighted item via `data-highlighted`. Group headings
`text-xs font-medium text-fg-muted`. Empty result: «Ничего не найдено по запросу „…“».

## 9. Keyboard shortcuts

| Keys | Action | Scope |
|---|---|---|
| `⌘K` / `Ctrl+K` | command palette | global |
| `Esc` | close the top overlay, then clear search focus | global |
| `?` | shortcuts reference | global |
| `/` | focus search | page |
| `C` | primary create action | page |
| `J` / `K`, `↓` / `↑` | next / previous row | tables |
| `X` | select focused row | tables |

Single-letter shortcuts work only when focus is not in a text field. Show them in menus and tooltips:

```html
<kbd class="inline-flex items-center rounded-sm border border-divider bg-surface-subtle px-1.5 py-0.5 font-mono text-xs font-medium text-fg-secondary">⌘K</kbd>
```
