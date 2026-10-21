@AGENTS.md

## Claude Code specifics

- Topic rules in `.claude/rules/` load automatically when you read or edit matching files. Before a change
  that spans several areas (for example a new screen with a new component), read each relevant rule file.
- A PostToolUse hook (`.claude/settings.json`) runs `lint` and `check` after every edit under `src/`. When it
  reports problems, fix them before moving on. Never disable a rule, add `eslint-disable` or loosen a check
  to make it pass — if a rule blocks legitimate work, stop and explain why.
- Skills: `/bootstrap` sets up a new project; `/import-design` brings a design from Claude Design into the
  system; `/publish-design-system` sends the system back to Claude Design. When the designer shares a design link
  or says they exported or changed something in Claude Design, use `/import-design` — don't improvise the steps.
  Publish only when they ask (it changes what their team sees in Claude Design). More skills may appear in
  `.claude/skills/`.
- Importing: snap every color to the nearest semantic token and every length to the nearest scale step, list
  each snap that visibly moved a value (`#3B82F6 → primary`, `13px → 3 (12px)`), and ask before adding a new
  token or scale step.
- To change how a component looks, edit its `*.variants.json`, not the classes in pages.
- Don't edit `build/`, `viewer/`, `scripts/` or `tests/` unless the task is about the toolchain.
- If the request conflicts with a rule here, say which rule and ask — don't silently pick one.
- Talk to the designer in the language they write in; keep code, file names and rules in English. Interface
  text in templates and fixtures follows `project.locale`, not the language of the conversation.
