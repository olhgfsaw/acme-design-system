---
paths:
  - "src/**/*.{njk,html}"
  - "src/data/**"
---

# Language, formats and text length

The UI language and locales are set in `src/project.json` (`locale`, `otherLocales`). It is independent of the language
you talk to the designer in, and Russian copy in these rules is only an illustration. Everything a user reads is in that language:
labels, buttons, fixtures, status labels, errors, empty states.

## 1. Formats — always through `Intl`

Never format numbers, money or dates by hand in templates. Use the template filters — they wrap `Intl` with
`project.locale`:

- `{{ d.amountMinor | money(d.currency) }}` — minor units in; decimals follow the currency.
- `{{ 12480 | number }}`, `{{ 1250000 | compact }}`, `{{ 0.482 | percent }}` (or `percent(1)` for one decimal).
- `{{ d.createdAt | date("short") }}` / `date("medium")` / `date("long")`, `| time`, `| datetime`.
- `{{ d.createdAt | relative }}` — relative to `project.referenceDate`; put the absolute date in `title`.
- `{{ n | plural({ one: "# сделка", few: "# сделки", many: "# сделок", other: "# сделки" }) }}`.
- `{{ status.label | label }}` — picks the current locale from `{ "ru": …, "en": … }`.
- `{{ owner.name | initials }}` — avatar fallback.

| Value | `ru-RU` | `en-US` |
|---|---|---|
| Money (`amountMinor: 125000000`, `RUB` / `USD`) | `1 250 000,00 ₽` | `$1,250,000.00` |
| Number | `12 480` | `12,480` |
| Date | `20.10.2026` / `20 окт. 2026 г.` | `10/20/2026` / `Oct 20, 2026` |
| Relative time | `2 ч назад` (absolute date in `title`) | `2 hours ago` |

- Group separators in `ru-RU` are non-breaking spaces (U+00A0), so `1 250 000 ₽` never wraps — don't
  replace them with regular spaces.
- Money is stored in minor units (`amountMinor`) with an ISO 4217 `currency`. Never divide by 100 in a template;
  the number of decimals depends on the currency.
- Dates are stored in UTC (ISO 8601) and shown in the user's time zone.
- Weeks start on the locale's first day (Monday for `ru-RU`).

## 2. Plurals

Russian has four plural forms (`one`, `few`, `many`, `other`): «1 сделка», «3 сделки», «5 сделок», «1,5 сделки».
Use the `| plural` filter with all four forms (`#` is replaced by the formatted number). Never write
«сделок(и)» or «сделка(и)». Where a plural form can't be produced, put the number after a colon: «Выбрано: 12».

## 3. Text length

- Russian text is often noticeably longer than English. Design for the longest locale and test with the
  `longStrings` fixture.
- No fixed widths on anything containing text. Buttons get `min-w-*` at most, never `w-*`.
- Truncate only where scanning matters (table cells, cards): `truncate` + the full value in `title` or a
  tooltip. Never truncate headings in forms, errors or buttons — let them wrap.
- Long unbreakable strings (emails, URLs, IDs): `wrap-break-word` (or `break-all` for IDs) inside their container.

## 4. Names

- Full names can be long and hyphenated («Константинопольский-Александровский Владислав»); don't assume
  «first name + last name» order or length.
- Avatar initials: first letters of the first two words of the display name.

## 5. Status labels and terms

- Status labels live in `src/data/statuses.json` per locale: `"label": { "ru": "В работе", "en": "In progress" }`.
  Code is `in_progress`; never show a code to the user.
- Domain terms come from `src/data/glossary.json`. One concept = one word across the product
  («Сделка» everywhere, not «Сделка» in one place and «Возможность» in another).

## 6. Direction

If the locale list includes a right-to-left language, use logical utilities everywhere: `ms-*` / `me-*`,
`ps-*` / `pe-*`, `start-*` / `end-*`, `text-start` / `text-end`, `border-s` / `border-e`.
