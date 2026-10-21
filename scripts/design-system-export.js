// `npm run design-system`: builds the files of this project's Design System in Claude (Claude Design)
// from the repository — tokens, brand book, component previews and guidelines — into .design-system/project/.
// /publish-design-system sends them to the Design System artifact. Run `npm run build` first.
//
//   node scripts/design-system-export.js          files for an update of an existing system
//   node scripts/design-system-export.js --new    also writes the index (design-system.json) for a first publish
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const outDir = path.join(root, ".design-system");
const out = path.join(outDir, "project");
const isNew = process.argv.includes("--new");
const notes = []; // what could not be brought over — goes into the README and the report

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const project = readJson("src/project.json");
const registry = readJson("src/components.json");
const css = fs.readFileSync(path.join(root, "src/styles/tokens.css"), "utf8");
if (!project.product) fail('src/project.json: "product" is not set — run /bootstrap first');
if (!fs.existsSync(path.join(root, "dist")) || !fs.existsSync(path.join(root, "frames/components")))
  fail("no build found — run `npm run build` first");

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}
function write(rel, text) {
  const file = path.join(out, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}
const px = (v) => (/rem$/.test(v) ? `${parseFloat(v) * 16}px` : v);

// ---------- tokens.css → tokens.json ----------
const block = (selector) => {
  const m = css.match(new RegExp(`(?:^|\\n)${selector}\\s*\\{([^}]*)\\}`));
  return m ? m[1] : "";
};
const decls = (body) =>
  [...body.matchAll(/--([\w-]+)\s*:\s*([^;]+);[ \t]*(?:\/\*\s*(.*?)\s*\*\/)?/g)].map(([, name, value, comment]) => ({
    name,
    value: value.trim(),
    comment: comment || "",
  }));

const palette = decls(block(":root")).filter((d) => d.name.startsWith("palette-"));
const paletteValue = Object.fromEntries(palette.map((d) => [d.name, d.value]));
const themeBlock = decls(block("@theme"));
const light = themeBlock.filter((d) => d.name.startsWith("color-") && d.value !== "initial");
const dark = Object.fromEntries(decls(block("\\.dark")).filter((d) => d.name.startsWith("color-")).map((d) => [d.name, d.value]));

function withAlpha(color, alpha) {
  const a = +(alpha / 100).toFixed(3);
  const ok = color.match(/^oklch\(([^)/]+)\)$/);
  if (ok) return `oklch(${ok[1].trim()} / ${a})`;
  const hex = color.match(/^#([0-9a-f]{6})$/i);
  if (hex) return `#${hex[1].toLowerCase()}${Math.round(a * 255).toString(16).padStart(2, "0")}`;
  return null;
}
// A tokens.css value → a value the Design System reads: an alias, a literal color, or null (skipped, noted).
function colorValue(value, where) {
  const alias = value.match(/^var\(--(palette-[\w-]+)\)$/);
  if (alias) return paletteValue[alias[1]] ? `{${alias[1]}}` : null;
  const mix = value.match(/^color-mix\(in \w+,\s*var\(--(palette-[\w-]+)\)\s+([\d.]+)%,\s*transparent\)$/);
  if (mix && paletteValue[mix[1]]) {
    const v = withAlpha(paletteValue[mix[1]], +mix[2]);
    if (v) return v;
  }
  if (/^(#|oklch\(|rgb|hsl)/.test(value) && !value.includes("var(")) return value;
  notes.push(`${where}: \`${value}\` can't be expressed as a Design System color — skipped`);
  return null;
}

// What each semantic token is for (tokens.md §1), shown on the Colors page in Claude Design.
const roles = {
  canvas: "bg-canvas — page and app background",
  surface: "bg-surface — cards, tables, panels, inputs",
  "surface-subtle": "bg-surface-subtle — table header, secondary areas, hover on rows and ghost buttons",
  "surface-overlay": "bg-surface-overlay — menus, popovers, modals, drawers",
  backdrop: "bg-backdrop — behind modals and drawers",
  skeleton: "bg-skeleton — loading placeholders",
  fg: "text-fg — headings, body, cell values",
  "fg-secondary": "text-fg-secondary — labels, metadata, table headers",
  "fg-muted": "text-fg-muted — placeholders, timestamps, hints",
  divider: "border-divider — decorative separators, card and table borders",
  control: "border-control — borders of inputs, checkboxes, radios, outline buttons (≥ 3:1)",
  primary: "bg-primary — primary buttons, selected controls",
  "primary-hover": "hover:bg-primary-hover — primary button on hover",
  "primary-active": "active:bg-primary-active — primary button while pressed",
  "on-primary": "text-on-primary — text and icons on primary",
  "primary-fg": "text-primary-fg — links, active tab and nav text on surfaces",
  "primary-subtle": "bg-primary-subtle — selected row, active nav item",
  focus: "outline-focus — keyboard focus outline only",
  "danger-solid": "bg-danger-solid — destructive buttons",
  "danger-solid-hover": "hover:bg-danger-solid-hover — destructive button on hover",
  "on-danger": "text-on-danger — text and icons on destructive buttons",
};
const toneRole = (n) => {
  const m = n.match(/^(neutral|info|success|warning|danger)-(bg|fg|border)$/);
  if (!m) return null;
  const what = { bg: "tint background", fg: "text and icons (≥ 4.5:1 on its -bg and every surface)", border: "border" }[m[2]];
  return `${m[2] === "bg" ? "bg" : m[2] === "fg" ? "text" : "border"}-${n} — ${m[1]} tone ${what}: badges, alerts, inline messages`;
};

const colorTokens = [];
for (const d of light) {
  const short = d.name.replace(/^color-/, "");
  const lightValue = colorValue(d.value, `--${d.name}`);
  const darkValue = dark[d.name] ? colorValue(dark[d.name], `.dark --${d.name}`) : null;
  if (!lightValue) continue;
  const value = darkValue && darkValue !== lightValue ? { light: lightValue, dark: darkValue } : lightValue;
  const usage = roles[short] || toneRole(short) || d.comment || `${short} — semantic color`;
  colorTokens.push({ name: d.name, value, usage });
}
for (const d of palette)
  colorTokens.push({
    name: d.name,
    value: d.value,
    usage: `Raw palette step${d.comment ? ` (${d.comment})` : ""}. Never used directly — only through the color-* tokens above.`,
  });

const spacingSteps = ["0", "px", "0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "5", "6", "7", "8", "9", "10", "11", "12", "14", "16", "20", "24", "28", "32", "36", "40", "44", "48", "52", "56", "60", "64", "72", "80", "96"];
const spacing = spacingSteps.map((s) => ({
  name: `spacing-${s}`,
  value: s === "px" ? "1px" : `${+s * 4}px`,
  usage: ["0.5", "1.5", "2.5", "3.5"].includes(s)
    ? `p-${s}, gap-${s} … — half step: only inside compact components (badge, tag, kbd, menu item, input)`
    : `p-${s}, m-${s}, gap-${s}, w-${s}, h-${s} — classic scale step`,
}));

const radiusDefaults = { xs: "2px", sm: "4px", md: "6px", lg: "8px", xl: "12px", "2xl": "16px", full: "9999px" };
for (const d of themeBlock) {
  const m = d.name.match(/^radius-(\w+)$/);
  if (m) radiusDefaults[m[1]] = px(d.value);
}
const radiusUse = {
  sm: "badge, tag, kbd",
  md: "button, input, menu item",
  lg: "card, table container, popover",
  xl: "modal",
  full: "avatar, status dot, round icon button",
};
const radius = Object.entries(radiusDefaults).map(([k, v]) => ({ name: `radius-${k}`, value: v, usage: `rounded-${k}${radiusUse[k] ? ` — ${radiusUse[k]}` : ""}` }));

const shadow = [
  ["xs", "0 1px 2px 0 rgb(0 0 0 / 0.05)", "solid and outline buttons, optional on cards"],
  ["lg", "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)", "popovers and menus — always with border-divider"],
  ["xl", "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)", "modals and drawers — always with border-divider"],
].map(([k, v, u]) => ({ name: `shadow-${k}`, value: v, usage: `shadow-${k} — ${u}. In dark mode elevation comes from surface-overlay plus a border.` }));

const font = project.font || "Inter";
const typeStyles = [
  ["page-title", "24px", "32px", 600, "-0.025em", "text-2xl font-semibold tracking-tight text-fg"],
  ["section-title", "18px", "28px", 600, null, "text-lg font-semibold text-fg — section and card titles"],
  ["body", "14px", "20px", 400, null, "text-sm text-fg — body, inputs, table cells"],
  ["label", "14px", "20px", 500, null, "text-sm font-medium text-fg — form labels"],
  ["meta", "12px", "16px", 500, null, "text-xs font-medium text-fg-secondary — metadata, badges, hints; the smallest size"],
  ["kpi", "30px", "36px", 600, null, "text-3xl font-semibold tabular-nums text-fg — KPI numbers"],
].map(([name, fontSize, lineHeight, fontWeight, letterSpacing, usage]) => ({
  name,
  fontSize,
  lineHeight,
  fontWeight,
  ...(letterSpacing ? { letterSpacing } : {}),
  usage,
}));

function git(...args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}
const remote = git("remote", "get-url", "origin");
const repo = (remote.match(/github\.com[:/]([^/]+\/[^/.]+)/) || [])[1] || "";
const sha = git("rev-parse", "--short", "HEAD");
const branch = git("rev-parse", "--abbrev-ref", "HEAD");
const dirty = git("status", "--porcelain", "--", "src") !== "";
if (dirty) notes.push("src/ has uncommitted changes — this sync includes work that is not in git yet");

const tokens = {
  name: project.product,
  version: 1,
  meta: {
    source: repo ? "github" : "local",
    ...(repo ? { repo } : {}),
    ref: sha ? `${branch}@${sha}` : "uncommitted",
    paths: { tokens: ["src/styles/tokens.css"], docs: ["AGENTS.md", ".claude/rules/"], components: ["src/components.json"] },
    synced: new Date().toISOString().slice(0, 10),
  },
  color: { themes: [{ id: "light", name: "Light" }, { id: "dark", name: "Dark" }], tokens: colorTokens },
  type: {
    fonts: [],
    families: { sans: `"${font}", system-ui, sans-serif` },
    groups: [{ name: "Text", family: "sans", styles: typeStyles }],
  },
  spacing: { note: "Tailwind classic scale, 4 px grid. Other multiples (p-13, w-81) are not allowed.", tokens: spacing },
  radius: { tokens: radius },
  shadow: { tokens: shadow },
};

// ---------- components ----------
const groupName = { ui: "UI", form: "Form", layout: "Layout", common: "Common", overlay: "Overlay", pattern: "Pattern" };
const list = (a) => (a && a.length ? a.join(", ") : "—");
const booleanProps = new Set(["disabled", "loading", "required", "invalid", "dot", "numeric", "open", "checked", "selected", "readonly"]);
const components = [];
const dts = ["// Props of each component, for reference. The production components are Vue SFCs (Nuxt + Reka UI) with the same names.", ""];

for (const [name, entry] of Object.entries(registry)) {
  if (entry.status === "deprecated") continue;
  const slug = path.basename(entry.path);
  const frame = path.join(root, "frames/components", `${slug}.html`);
  if (!fs.existsSync(frame)) {
    notes.push(`${name}: no matrix page (${entry.path}/${slug}.matrix.njk) — no preview`);
    continue;
  }
  const html = fs.readFileSync(frame, "utf8");
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/) || [])[1] || "";
  const bodyClass = ((html.match(/<body[^>]*class="([^"]*)"/) || [])[1] || "bg-canvas").replace(/\b(min-h|h)-dvh\b/g, "").trim();
  const lang = (html.match(/<html[^>]*lang="([^"]*)"/) || [])[1] || "en";
  const variants = Object.entries(entry.variants || {}).map(([k, v]) => `${k}: ${v.join(" · ")}`);
  const subtitle = variants.join("; ").replace(/"/g, "'").slice(0, 200);
  const preview = [
    `<!-- @dsCard group="${groupName[entry.category] || "Components"}" height=480${subtitle ? ` subtitle="${subtitle}"` : ""} -->`,
    "<!doctype html>",
    `<html lang="${lang}">`,
    `<head><meta charset="utf-8"><title>${name} — preview</title></head>`,
    `<body class="${bodyClass}">`,
    body
      .replace(/<script[\s\S]*?<\/script>/g, "")
      .replace(/<header[\s\S]*?<\/header>/, "") // the card already shows the name
      .trim(),
    "</body>",
    "</html>",
    "",
  ].join("\n");
  if (Buffer.byteLength(preview) > 250 * 1024) {
    notes.push(`${name}: matrix page is larger than 250 KB — no preview`);
    continue;
  }
  write(`components/${name}/preview.html`, preview);

  const summary = entry.description || `${name} — a ${entry.category} component of the ${project.product} design system.`;
  write(
    `components/${name}/README.md`,
    [
      `# ${name}`,
      "",
      summary.endsWith(".") ? summary : `${summary}.`,
      "",
      `| | |`,
      `|---|---|`,
      `| Status | ${entry.status || "draft"}${entry.status === "approved" ? " — signed off by the client" : ""} |`,
      ...Object.entries(entry.variants || {}).map(([k, v]) => `| ${k} | ${v.join(", ")} |`),
      `| Props | ${list(entry.props)} |`,
      `| Slots | ${list(entry.slots)} |`,
      `| Interaction states | ${list(entry.states)} |`,
      ...(entry.dataStates ? [`| Data states | ${list(entry.dataStates)} |`] : []),
      `| Reka UI primitive | ${entry.reka || "—"} |`,
      "",
      `The preview is a static rendition of the matrix page in the repository (\`${entry.path}\`). Hover, focus and`,
      "pressed states are drawn side by side, not interactive. To change this component, change it in Claude Design",
      "and bring the export in with `/import-design`, or ask Claude Code in the repository — not on this page.",
      "",
    ].join("\n"),
  );

  const props = (entry.props || []).map((p) => {
    const union = entry.variants?.[p];
    const type = union ? union.map((v) => `"${v}"`).join(" | ") : booleanProps.has(p) ? "boolean" : "string";
    return `  ${p}?: ${type};`;
  });
  dts.push(`/** ${summary.replace(/\*\//g, "")} Slots: ${list(entry.slots)}. */`, `export interface ${name}Props {`, ...props, "}", "");
  components.push({ name, entry });
}
write("components/index.d.ts", dts.join("\n"));

// The project's compiled stylesheet: the previews use the same classes as the frames.
const cssFiles = fs.readdirSync(path.join(root, "dist/assets")).filter((f) => f.endsWith(".css"));
const built = cssFiles.map((f) => fs.readFileSync(path.join(root, "dist/assets", f), "utf8")).find((c) => c.includes("--color-surface"));
if (!built) fail("dist/assets has no stylesheet with the tokens — run `npm run build`");
const bundleCss = built
  .replace(/@font-face\{[^}]*\}/g, "") // project fonts load from Google Fonts in Claude Design
  .replace(/(^|[^\w\\-])\.dark(?=[\s,{)])/g, "$1:is(.dark,[data-theme=dark])"); // Claude Design switches themes with data-theme
write("components/bundle.css", bundleCss);

// ---------- README: the brand book ----------
const semantic = colorTokens.filter((t) => t.name.startsWith("color-"));
const statusCount = (s) => components.filter((c) => (c.entry.status || "draft") === s).length;
const readme = [
  `# ${project.product}`,
  "",
  `The ${project.product} design system: semantic color tokens in a light and a dark theme, one type scale, the Tailwind`,
  "spacing scale and a small set of components. Every value here comes from the repository",
  repo ? `[${repo}](https://github.com/${repo}) (${tokens.meta.ref}).` : `(${tokens.meta.ref}).`,
  "",
  "**Source of truth is the repository.** This page is regenerated from it with `/publish-design-system` in Claude",
  "Code; token or README edits made here are overwritten by the next sync. Change the design in Claude Design, bring",
  "it into the repository with `/import-design`, then publish again.",
  "",
  "## Using this system in a design",
  "",
  "- Colors: only the `color-*` tokens below, by role. Never a palette step, never a color that isn't a token.",
  "- Lengths: only steps of the spacing scale (4 px grid); radii and shadows only from their tokens.",
  "- Type: only the styles below. Nothing smaller than 12 px.",
  "- Components: reuse the ones listed here by name and variant. A new repeating piece is a new component —",
  "  name it, and it will be registered when the design is imported.",
  "- Screens that show data also need their loading, empty and error states (and no-results for search and filters).",
  "",
  "## Content",
  "",
  `- Interface language: **${project.locale || "not set"}**${project.otherLocales?.length ? `; also ${project.otherLocales.join(", ")}` : ""}. Every word a user reads is in it.`,
  "- Sentence case everywhere: «Create deal», not «Create Deal».",
  `- Numbers, money${project.currency ? ` (${project.currency})` : ""} and dates are formatted for the locale; plurals use the locale's rules.`,
  "- Layouts fit the longest locale; no fixed widths on anything that contains text.",
  "",
  "## Color",
  "",
  "Components use semantic tokens only; the theme switches their values, so markup is the same in light and dark.",
  "Every text token passes 4.5:1 on every surface in both themes; `color-control` and `color-focus` pass 3:1.",
  "Those guarantees hold for these pairs only: on a tone background use that tone's `-fg`.",
  "",
  "| Token | Utility and use |",
  "|---|---|",
  ...semantic.map((t) => `| \`${t.name}\` | ${t.usage} |`),
  "",
  "## Type",
  "",
  `One family: **${font}**. Weights 400, 500, 600. Numbers in columns use tabular figures.`,
  "",
  "| Style | Size / line | Classes |",
  "|---|---|---|",
  ...typeStyles.map((s) => `| ${s.name} | ${s.fontSize} / ${s.lineHeight} | ${s.usage} |`),
  "",
  "## Spacing, radius, elevation",
  "",
  "- Layout spacing (page padding, gaps between sections, cards, form rows) uses whole steps on the 4 px grid.",
  "- Half steps (2, 6, 10, 14 px) only inside compact components.",
  "- Radius: badge `radius-sm`, button and input `radius-md`, card and popover `radius-lg`, modal `radius-xl`.",
  "- Elevation: overlays get a shadow and a `color-divider` border, so they work in both themes.",
  "",
  "## Accessibility (WCAG 2.2 AA)",
  "",
  "- Targets at least 24 × 24 px with a mouse and 44 × 44 px on touch.",
  "- Visible keyboard focus on everything interactive: a 2 px `color-focus` outline with a 2 px offset.",
  "- Status is never shown by color alone: a label or an icon carries the meaning.",
  "- Real buttons, links and labelled inputs; icon-only buttons have an accessible name.",
  "- Dragging always has a non-drag alternative (menu or buttons).",
  "",
  "## Icons",
  "",
  "Lucide, stroke icons in the text color: 16 px inside buttons and inputs, 20 px in toolbars, 24 px in empty states.",
  "",
  "## Components",
  "",
  `${components.length} component(s): ${statusCount("approved")} approved, ${statusCount("review")} in review, ${statusCount("draft")} draft.`,
  "",
  "| Component | Group | Status | Variants |",
  "|---|---|---|---|",
  ...components.map(({ name, entry }) => `| ${name} | ${groupName[entry.category] || entry.category} | ${entry.status || "draft"} | ${Object.entries(entry.variants || {}).map(([k, v]) => `${k}: ${v.join(", ")}`).join("; ") || "—"} |`),
  "",
  ...(notes.length ? ["## Not synced", "", ...notes.map((n) => `- ${n}`), ""] : []),
].join("\n");
write("README.md", readme);
write("tokens.json", JSON.stringify(tokens, null, 2) + "\n");

if (isNew) {
  const at = new Date().toISOString();
  write(
    "design-system.json",
    JSON.stringify(
      {
        v: 3,
        layout: "files",
        createdOnFiles: { v: 1, at },
        title: project.product,
        namespace: project.product.replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^./, (c) => c.toUpperCase()),
        libraries: [],
        sections: {},
        groups: [],
        assetGroups: {},
        blobs: {},
        docs: { readme: "project/README.md", sections: [] },
        lastChange: { by: "Claude", at, via: `Claude Code · ${repo || "local"}@${sha || "uncommitted"}`, note: "first publish from the repository" },
      },
      null,
      2,
    ) + "\n",
  );
}

// The `files` map for the publish call (system path → source under .design-system/). The index
// (project/design-system.json) is not in it: it goes as `file_path`, in the last call.
const files = {};
(function collect(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    const rel = path.relative(outDir, p).split(path.sep).join("/");
    if (f.isDirectory()) collect(p);
    else if (rel !== "project/design-system.json") files[rel] = rel.endsWith(".d.ts") ? { from: rel, contentType: "text/plain" } : rel;
  }
})(out);
const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(path.join(outDir, "files.json"), JSON.stringify(sorted, null, 2) + "\n");

console.log(`✓ design system files in .design-system/project (${Object.keys(files).length + (isNew ? 1 : 0)} files: ${colorTokens.length} colors, ${components.length} components)`);
if (notes.length) console.log(`Not synced:\n${notes.map((n) => `  - ${n}`).join("\n")}`);
