// Lints the RENDERED frames (/frames/**/*.html): what the client sees, with every class from the variants maps.
// Run via `npm run lint` (renders first). Rules mirror AGENTS.md §3 and .claude/rules/tokens.md.
import htmlParser from "@html-eslint/parser";
import html from "@html-eslint/eslint-plugin";
import tailwind from "eslint-plugin-better-tailwindcss";

const SCALE = "0|0\\.5|1|1\\.5|2|2\\.5|3|3\\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96";
const SPACING =
  "p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|w|h|size|min-w|min-h|max-h|inset|inset-x|inset-y|top|right|bottom|left|start|end|scroll-m[trblxy]?|scroll-p[trblxy]?|translate-x|translate-y";

export default [
  {
    files: ["frames/**/*.html"],
    languageOptions: { parser: htmlParser },
    plugins: { html, "better-tailwindcss": tailwind },
    settings: { "better-tailwindcss": { entryPoint: "src/styles/tokens.css" } },
    rules: {
      // Tailwind classes
      "better-tailwindcss/no-unknown-classes": ["error"],
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/enforce-canonical-classes": "error",
      "better-tailwindcss/no-deprecated-classes": "error",
      "better-tailwindcss/no-duplicate-classes": "error",
      "better-tailwindcss/no-restricted-classes": [
        "error",
        {
          restrict: [
            { pattern: "(?:^|:)dark:", message: "No dark: in markup — the theme switches tokens (tokens.md §2)." },
            { pattern: "(?:^|:)-?space-[xy]-", message: "No space-x/y — use flex or grid with gap-* (tokens.md §3)." },
            { pattern: "(?:^|:)(?!grid-(?:cols|rows)-\\[)-?[a-z0-9-]+-\\[(?!calc\\()[^\\]]*\\]$", message: "Arbitrary value $0 — use a token or a scale step (AGENTS.md §3)." },
            { pattern: "(?:^|:)\\[[^\\]]*\\]$", message: "Arbitrary property $0 is not allowed." },
            { pattern: `(?:^|:)-?(?:${SPACING})-(?!(?:${SCALE})$)\\d+(?:\\.\\d+)?$`, message: "$0 is off the spacing scale (tokens.md §3)." },
            { pattern: "(?:^|:)!|!$", message: "No ! important modifier — fix the variants map instead." },
            { pattern: "(?:^|:)(?:rounded|shadow|blur)$", message: "Bare $0 is ambiguous in v4 — use the named step (rounded-sm, shadow-xs)." },
            { pattern: "(?:^|:)outline-none$", message: "outline-none removes focus — use the focus classes from tokens.md §7." },
          ],
        },
      ],
      // HTML and accessibility basics (axe in test:a11y covers contrast and ARIA in the browser)
      "html/require-button-type": "error",
      "html/require-img-alt": "error",
      "html/require-lang": "error",
      "html/require-frame-title": "error",
      "html/no-duplicate-id": "error",
      "html/no-duplicate-attrs": "error",
      "html/no-inline-styles": "error",
      "html/no-multiple-h1": "error",
      "html/no-skip-heading-levels": "error",
      "html/no-nested-interactive": "error",
      "html/no-positive-tabindex": "error",
      "html/no-aria-hidden-on-focusable": "error",
      "html/no-invalid-role": "error",
      "html/no-abstract-roles": "error",
      "html/no-heading-inside-button": "error",
      "html/no-restricted-tags": ["error", { tagPatterns: ["^style$"], message: "No <style> — use tokens and utilities." }],
    },
  },
];
