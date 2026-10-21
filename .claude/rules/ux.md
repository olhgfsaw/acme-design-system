---
paths:
  - "src/components/**"
  - "src/pages/**"
---

# UX standards — NN/g heuristics applied

## 1. Ten heuristics as checks (Nielsen Norman Group)

1. **Visibility of system status** — every fetch, filter and save shows progress (section 2); active filters
   are visible as chips with «Сбросить всё».
2. **Match with the real world** — domain words from `src/data/glossary.json` («Сделка», «Счёт»), never table
   or field names (`deal_entity`, `amountMinor`).
3. **User control and freedom** — every form has «Отмена», every modal can be closed, routine deletions undo.
4. **Consistency** — the primary action is top-right on a page and bottom-right in a modal or drawer footer;
   a status keeps its tone everywhere.
5. **Error prevention** — sensible defaults, input masks, disabled out-of-range dates, confirmation only
   where data is lost for good.
6. **Recognition over recall** — pickers show avatar + name + secondary detail, never a bare ID.
7. **Flexibility and efficiency** — keyboard shortcuts (`patterns.md`), density toggle, bulk actions.
8. **Minimalist design** — secondary fields behind «Дополнительно»; one primary action per view.
9. **Help users recover from errors** — say what happened and how to fix it (section 6).
10. **Help and documentation** — a tooltip or hint on every non-obvious metric or field.

## 2. Response time

| Expected wait | Show |
|---|---|
| under 1 s | nothing (avoid flashing a loader) |
| 1–10 s, loading a view | skeleton of the final layout |
| 1–10 s, an action | the button gets `aria-busy="true"` and a spinner, and is disabled; the rest of the page stays usable |
| over 10 s | progress with percent or steps, an estimate if known, and «Отменить» |
| background job | status in the UI and a notification when done |

## 3. Tables and lists

- Text and dates left-aligned; numbers, money, percentages right-aligned with `tabular-nums`; status
  badges left-aligned.
- Show full values in tables. Abbreviations (`1,2 млн`) only in cards and charts, with the full value in a tooltip.
- 8+ columns: sticky first column (identifier) and sticky last column (row actions).
- Density: comfortable rows 48–56 px, compact 36–40 px. In compact mode row actions still meet 24 px.
- Selecting rows shows a `BulkActionBar`: count («Выбрано: 12»), actions, «Снять выделение».
- Check every list view against the four table tasks: find a record, compare records, view or edit one
  record, act on one or many records.
- Filters: instant for single selects and search (debounced), batch («Применить») for multi-field filters.

## 4. Forms

- Labels above fields; one column for most forms; group related fields in `FormSection`.
- Validation timing — reward early, punish late: no error while the user is typing in an untouched field;
  validate on blur; once a field shows an error, re-validate on every input and clear it as soon as it's valid.
- The submit button is enabled; on submit, show all errors and move focus to the summary or first error.
  Exception: a wizard step's «Далее» may be disabled until its required fields are filled — then say which.

## 5. Destructive actions

| Kind | Pattern |
|---|---|
| Reversible (archive, unlink, remove from list) | do it immediately, show an undo toast for 6–8 s (paused on hover and focus); the item stays recoverable from the archive |
| Irreversible (delete forever, revoke access) | `ConfirmModal`: what will be lost, a danger button with verb and count («Удалить 3 сделки»), «Отмена» focused by default |
| Critical (delete workspace, wipe data) | as above, plus typing the object's name to confirm |
| Closing with unsaved changes (form, modal, drawer, wizard) | if anything was edited, ask «Закрыть без сохранения? Изменения пропадут.» with «Продолжить редактирование» (secondary, focused) and «Закрыть» (danger). Page or drawer: `ConfirmModal`. Inside a modal: an inline confirmation that replaces the modal footer (never a modal on a modal). Nothing edited → close at once, no question |

Don't confirm reversible actions or actions with nothing to lose — a confirmation on every click teaches
people to click through it.

## 6. Messages and copy

- Choose the channel by severity: inline message at the field or section; banner for page-wide persistent
  issues; toast only for short confirmations; modal only for decisions that block work.
- Error copy = what happened + how to fix it: «Телефон должен начинаться с кода страны, например +7 900 000-00-00».
- Buttons are verb + object: «Создать сделку», «Сохранить изменения», «Удалить 3 сделки». Never «ОК»,
  «Да», «Подтвердить» on their own.
- Sentence case everywhere. No exclamation marks in system messages. Address the user consistently
  (formal «вы» unless the project says otherwise).
- Empty-state copy explains the value of the area, not just its emptiness: «Здесь появятся сделки — создайте
  первую, чтобы отслеживать воронку».

## 7. Choosing an overlay

| Need | Component | Width |
|---|---|---|
| Short confirmation or alert | `ConfirmModal` | `max-w-md` |
| Create or edit a small entity | `BaseModal` | `max-w-xl` |
| Inspect or edit a record while keeping the list visible | `BaseDrawer` | `max-w-xl` or `max-w-2xl` |
| Multi-step process (import, checkout, onboarding) | `StepWizard` in a modal or a page | `max-w-3xl` |
| Contextual actions | `BaseDropdown` | content width |
| Extra information on hover or focus | `BaseTooltip` (text only, no interactive content) | `max-w-xs` |

Never stack a modal on a modal. A drawer may open a `ConfirmModal`.
