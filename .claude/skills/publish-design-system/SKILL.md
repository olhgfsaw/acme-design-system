---
name: publish-design-system
description: Publish this repository's design system to Claude (Claude Design) as a Design System — tokens, brand book, component previews — so new designs in Claude Design start from it. Run after a bootstrap, an import or an approval; the next run updates the same system.
disable-model-invocation: true
argument-hint: "[optional: link to an existing design system to update]"
---

# Publish the design system to Claude Design

The designer designs in Claude Design (inside Claude: designs and design systems are artifacts). This command sends
the system that lives in this repository there, so every new design starts from the real tokens and components.
The repository stays the source of truth: the published system is regenerated from it each time. Talk to the
designer in their language, briefly, without logs. Link given as an argument (may be empty): $ARGUMENTS

## 0. Preconditions

- Artifacts must be available in this session: Claude Code signed in with a claude.ai account (`/login`; the desktop
  app is signed in already), a Pro, Max, Team or Enterprise plan. If the Artifact tool can't list types, or its type
  list has no "Design System", stop and say so in plain words (Team/Enterprise: an owner turns on Artifacts and the
  Design systems template under Organization settings → Artifacts).
- `src/project.json` has `product` and `locale`. If not, suggest `/bootstrap` and stop.
- Run `npm run verify`. Publish only a system that passes; if something fails, fix it first (or stop and explain).
- Uncommitted changes under `src/`: commit them first (`git add -A && git commit`), so the system names a real commit.

## 1. Build the files

- First publish (no `designSystem` in `src/project.json` and no link in the argument): `npm run design-system -- --new`.
- Update: `npm run design-system`.

This writes `.design-system/project/` (not in git): `tokens.json`, `README.md`, `components/<Name>/preview.html` and
`README.md` for every registered component that has a matrix page, `components/bundle.css`, `components/index.d.ts`,
and for a first publish the index `design-system.json`. `.design-system/files.json` is the exact `files` map for the
publish call. Read the script's report: everything under "Not synced" goes into your final message.

Never hand-edit token values or previews in `.design-system/` — fix the repository and run the script again.

## 2. The target

- Target = the link in the argument, else `designSystem` in `src/project.json`, else none (first publish).
- Read the target first (Artifact `read`, then its `project/design-system.json` and `project/tokens.json` by
  `path`). If it isn't a Design System, or you can't edit it, stop and say so — never publish over something else.
- First publish: create one system from the **Design System** type (Artifact `list` with scope `types` gives its
  link): `type_url` = that link, `title` = `product` from `src/project.json`, `auto_open: "after_first_write"`, no
  files. The type's instructions come back with it. Follow them for everything about the format; this skill only
  says what to send.

## 3. Publish

One Artifact publish to the target's `url`:
- `root` = the absolute path of `.design-system`
- `file_path` = the absolute path of `.design-system/project/design-system.json` (the index)
- `files` = the contents of `.design-system/files.json` as-is (`.d.ts` files carry `contentType: "text/plain"`)

First publish: the index is the one the script wrote. Update: read the live `project/design-system.json` right
before the call, change only `lastChange` (`by` = the designer's name or "Claude", `at` = now, `via` = "Claude Code ·
<repo>@<short sha>", `note` = one line: what changed), keep every other key, write it to
`.design-system/project/design-system.json`, then publish.

On an update, also:
- Before overwriting, compare the live `README.md`, `tokens.json` and each component `README.md` with the new ones.
  Changes someone made on the page that the repository doesn't have: list them and ask — bring them into the
  repository first (then rebuild), or overwrite. Never silently drop them.
- Tokens the repository no longer defines: list them and ask before removing.
- Never delete fonts, logos, icons or other assets someone uploaded on the page.
- Send only files that changed, plus `tokens.json` whole whenever any token changed.

## 4. The cover

Every Design System has a cover (`components/Cover/preview.html`). On a first publish, and when the product name or
the brand palette changes, write it last, exactly as the type's `artifact-type/reference/cover.md` describes (read it
on the target's url), using only `color-*` and `palette-*` tokens, spacing and radius tokens. Publish it as one more
file in the same or a following call. Otherwise leave it as it is.

## 5. Record

- First publish: set `"designSystem": "<the system's link>"` in `src/project.json`.
- Commit: `Publish design system to Claude Design: <one line>`. Don't push unless asked.

## 6. Tell the designer

Short, in their language:
- the system is published (the link is on the card — don't paste it), from which commit;
- what's in it: N colors in light and dark, type styles, spacing, radii, M components with their statuses;
- "Not synced" items, if any;
- how to use it: when creating a design in Claude, pick this design system in the design-system menu. To make it the
  default for every new design: Artifacts → Claude Design menu → View design systems → this system's menu → Set as
  default;
- edits belong in the repository (Claude Design → `/import-design`, or a request here), not on the system's page —
  the next publish regenerates it.
