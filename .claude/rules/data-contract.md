---
paths:
  - "src/data/**"
---

# Data contracts — schemas, fixtures, views

Screens define the data they need. The backend takes these files as the starting point for the API.
Templates read them as `data.fixtures.<entity>.scenarios[scenario]`, `data.views.<entity>.<view>`,
`data.statuses`, `data.glossary` (file names in camelCase).

## 1. Lifecycle

1. **Draft** — designer and Claude write `schemas/`, `fixtures/`, `views/` here (`"x-status": "draft"`).
2. **Proposed** — the schema goes to the API collection as a proposal; backend reviews naming, indexes,
   permissions (`"x-status": "proposed"`).
3. **Accepted** — backend's version is canonical (`"x-status": "accepted"`). Frontend generates TypeScript
   types and Zod schemas from it; CI checks fixtures against it. Change an accepted schema only together
   with backend.

## 2. Schemas — `schemas/<entity>.schema.json`

JSON Schema 2020-12 (the dialect of OpenAPI 3.1, so it moves into the API spec without rewriting).

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Deal",
  "x-entity": "deal",
  "x-status": "draft",
  "type": "object",
  "additionalProperties": false,
  "required": ["id", "title", "amountMinor", "currency", "status", "owner", "createdAt"],
  "properties": {
    "id": { "type": "integer", "description": "Unique identifier" },
    "title": { "type": "string", "maxLength": 200, "description": "Deal name shown in lists" },
    "amountMinor": { "type": "integer", "minimum": 0, "description": "Amount in minor units of currency" },
    "currency": { "type": "string", "pattern": "^[A-Z]{3}$", "description": "ISO 4217 code" },
    "status": { "type": "string", "enum": ["new", "in_progress", "won", "lost"], "x-dict": "dealStatus", "description": "Code; labels and tones in statuses.json" },
    "owner": {
      "type": ["object", "null"],
      "additionalProperties": false,
      "required": ["id", "name"],
      "properties": { "id": { "type": "integer" }, "name": { "type": "string" }, "avatarUrl": { "type": ["string", "null"], "format": "uri" } },
      "description": "null when the deal is unassigned"
    },
    "contactEmail": { "type": "string", "format": "email", "description": "Absent when no contact is linked" },
    "createdAt": { "type": "string", "format": "date-time", "description": "UTC" }
  }
}
```

- `additionalProperties: false` on every object, so a typo in a fixture fails the check.
- Enum properties shown as statuses carry `"x-dict": "<dictionary>"`; `npm run check` requires the enum and
  that dictionary in `statuses.json` to have exactly the same codes.
- Every property has a `description`. Say whether "no value" means absent or `null` — they are different.
- Names in `camelCase`; identifiers are `id` (never `dealId` inside the deal itself).
- Money: integer `amountMinor` + ISO 4217 `currency`. Never floats, never `amountCents`.
- Timestamps: ISO 8601 UTC strings (`2026-10-20T09:30:00Z`); dates without time: `format: date`.
- Enums: lowercase `snake_case` codes (`in_progress`), never display text.
- Lists: `page` (1-based), `perPage` (default 25), response `{ "items": [], "total": 0 }`.

## 3. Fixtures — `fixtures/<entity>.json`

Six scenarios, all valid against the schema, all in the UI language:

| Scenario | Content |
|---|---|
| `typical` | 8–12 realistic records: real-looking companies, names, emails, varied statuses |
| `empty` | `[]` |
| `longStrings` | longest realistic values: long titles, hyphenated Cyrillic names, long emails, many tags |
| `largeNumbers` | 9–12 digit amounts, large IDs, counts in the thousands |
| `partial` | only required fields; optional fields absent, nullable fields `null` |
| `many` | 200+ records, never hand-written: `"many": { "$generate": { "from": "typical", "count": 240 } }` — the build expands it into copies with unique ids |

The canvas Stress tab reads `stress` = `longStrings` + `largeNumbers` + `partial` + `many`; the build assembles it — don't write it by hand.

```json
{
  "entity": "deal",
  "scenarios": {
    "typical": [
      { "id": 101, "title": "Внедрение CRM для отдела продаж", "amountMinor": 125000000, "currency": "RUB", "status": "in_progress",
        "owner": { "id": 4, "name": "Анна Соколова", "avatarUrl": null }, "contactEmail": "i.petrov@severstal-trade.ru", "createdAt": "2026-08-14T09:30:00Z" }
    ],
    "empty": [],
    "partial": [
      { "id": 103, "title": "Черновик сделки", "amountMinor": 0, "currency": "RUB", "status": "new", "owner": null, "createdAt": "2026-10-20T17:00:00Z" }
    ]
  }
}
```

## 4. Views — `views/<entity>.<view>.json`

```json
{
  "entity": "deal",
  "view": "list",
  "defaultDensity": "comfortable",
  "columns": [
    { "key": "title", "label": "Сделка", "align": "left", "sticky": "left", "width": "w-72" },
    { "key": "amountMinor", "label": "Сумма", "align": "right", "format": "money", "currencyKey": "currency" },
    { "key": "status", "label": "Статус", "align": "left", "format": "badge", "dict": "dealStatus" },
    { "key": "owner", "label": "Ответственный", "align": "left", "format": "avatar" },
    { "key": "createdAt", "label": "Создана", "align": "left", "format": "date" },
    { "key": "actions", "label": "Действия", "align": "right", "sticky": "right", "format": "rowActions" }
  ],
  "filters": [
    { "key": "search", "control": "search", "mode": "instant" },
    { "key": "status", "control": "multiselect", "dict": "dealStatus", "mode": "batch" },
    { "key": "createdAt", "control": "dateRange", "mode": "batch" }
  ],
  "sort": { "allowed": ["createdAt", "amountMinor", "title"], "default": "createdAt:desc" }
}
```

- `width` uses scale classes only. A visually hidden column label (row actions) still has text for screen readers.
- Kanban views list status **codes** only — labels and tones come from `statuses.json`:
  `{ "entity": "deal", "view": "kanban", "groupBy": "status", "dict": "dealStatus", "columns": ["new", "in_progress", "won", "lost"], "wipLimits": { "in_progress": 15 }, "cardFields": ["title", "amountMinor", "owner"] }`

## 5. Dictionaries

- `statuses.json` — the single source for status display:
  `{ "dealStatus": { "in_progress": { "label": { "ru": "В работе", "en": "In progress" }, "tone": "info" } } }`.
  Keys must equal the schema enum (`npm run check`). Tones: `neutral`, `info`, `success`, `warning`, `danger`.
- Tone class strings live in `badge.variants.json` (see `tokens.md`). Never store color names in data.
- Render a status with `{{ statusBadge("dealStatus", d.status) }}` from `components/ui/badge/badge.njk`.
- `glossary.json` — domain terms per locale; copy in screens uses these words.
