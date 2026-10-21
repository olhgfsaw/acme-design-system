// Renders every frame from src/canvas.json and every component matrix page to static HTML in /frames.
// Build tooling — not part of the design system. Agents: don't edit unless the task is about the toolchain.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import nunjucks from "nunjucks";

const require = createRequire(import.meta.url);

// ---------- file helpers ----------
export function walk(dir, test) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p, test) : test(p) ? [p] : [];
  });
}
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

// ---------- inputs ----------
export function loadProject(root) {
  return readJson(path.join(root, "src/project.json"));
}

export function loadVariants(root) {
  const out = {};
  for (const f of walk(path.join(root, "src/components"), (p) => p.endsWith(".variants.json"))) {
    out[camel(path.basename(f, ".variants.json"))] = readJson(f);
  }
  return out;
}

// Expands { "$generate": { "from": "typical", "count": 240 } } into deterministic copies.
function expandScenarios(fixture) {
  const sc = fixture?.scenarios;
  if (!sc) return fixture;
  for (const [name, value] of Object.entries(sc)) {
    if (value && !Array.isArray(value) && value.$generate) {
      const { from = "typical", count = 200 } = value.$generate;
      const base = sc[from] || [];
      sc[name] = base.length
        ? Array.from({ length: count }, (_, i) => {
            const r = structuredClone(base[i % base.length]);
            if (typeof r.id === "number") r.id = 100000 + i;
            else if (typeof r.id === "string") r.id = `${r.id}-${i}`;
            return r;
          })
        : [];
    }
  }
  // "stress" = every edge case at once: long strings, large numbers, missing values, 200+ records.
  if (!sc.stress) {
    Object.defineProperty(sc, "stress", {
      value: ["longStrings", "largeNumbers", "partial", "many"].flatMap((k) => (Array.isArray(sc[k]) ? sc[k] : [])),
      enumerable: false,
    });
  }
  return fixture;
}

// ---------- data states ----------
// default · loading · empty · no-results · error · stress. Declared per screen (canvas.json "states")
// or per component (components.json "dataStates"); each declared state is rendered as its own frame.
export const DATA_STATES = ["default", "loading", "empty", "no-results", "error", "stress"];
const STATE_CONTEXT = {
  default: { state: "default" },
  loading: { state: "loading" },
  empty: { state: "empty", scenario: "empty" },
  "no-results": { state: "no-results", scenario: "empty" },
  error: { state: "error" },
  stress: { state: "default", scenario: "stress" },
};
export const frameFile = (id, s) => (s && s !== "default" ? `${id}--${s}` : id);
const withDefault = (list) => ["default", ...(list || []).filter((s) => s !== "default")];

export function loadData(root) {
  const dir = path.join(root, "src/data");
  const data = {};
  for (const f of walk(dir, (p) => p.endsWith(".json"))) {
    // fixtures/deal.json → data.fixtures.deal · schemas/deal.schema.json → data.schemas.deal · views/deal.list.json → data.views.deal.list
    const parts = path
      .relative(dir, f)
      .replace(/(\.schema)?\.json$/, "")
      .split(path.sep)
      .flatMap((s) => s.split("."))
      .map(camel);
    let node = data;
    parts.slice(0, -1).forEach((k) => (node = node[k] ??= {}));
    const value = readJson(f);
    node[parts.at(-1)] = parts[0] === "fixtures" ? expandScenarios(value) : value;
  }
  return data;
}

export function loadCanvas(root) {
  const canvas = readJson(path.join(root, "src/canvas.json"));
  const registry = fs.existsSync(path.join(root, "src/components.json")) ? readJson(path.join(root, "src/components.json")) : {};
  const matrices = walk(path.join(root, "src/components"), (p) => p.endsWith(".matrix.njk")).sort();
  const components = matrices.map((f) => {
    const slug = path.basename(f, ".matrix.njk");
    const name = Object.keys(registry).find((k) => registry[k].path && path.resolve(root, registry[k].path) === path.dirname(f)) || slug;
    return {
      id: `components/${slug}`,
      title: name,
      page: path.relative(path.join(root, "src"), f).split(path.sep).join("/"),
      status: registry[name]?.status || "draft",
      category: registry[name]?.category || "ui",
      states: withDefault(registry[name]?.dataStates),
    };
  });
  const flows = (canvas.flows || []).map((flow) => ({
    ...flow,
    frames: (flow.frames || []).map((f) => ({ ...f, states: withDefault(f.states) })),
  }));
  return { flows, components };
}

// ---------- template environment ----------
function iconFactory(root) {
  const dir = path.join(path.dirname(require.resolve("lucide-static/package.json", { paths: [root] })), "icons");
  return (name, classes = "size-4") => {
    const file = path.join(dir, `${name}.svg`);
    if (!fs.existsSync(file)) throw new Error(`icon("${name}"): no such Lucide icon`);
    const svg = fs
      .readFileSync(file, "utf8")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\s(width|height)="24"/g, "")
      .replace(/\sclass="[^"]*"/, "")
      .replace("<svg", `<svg class="${classes}" aria-hidden="true" focusable="false"`)
      .replace(/\s+/g, " ")
      .replace(/> </g, "><")
      .trim();
    return new nunjucks.runtime.SafeString(svg);
  };
}

function filters(project) {
  const locale = project.locale || "en-US";
  const fractionDigits = (currency) =>
    new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits;
  const ref = new Date(project.referenceDate || Date.now());
  const units = [["year", 31536e6], ["month", 2592e6], ["week", 6048e5], ["day", 864e5], ["hour", 36e5], ["minute", 6e4]];
  return {
    money: (minor, currency = project.currency || "USD") =>
      minor == null ? "" : new Intl.NumberFormat(locale, { style: "currency", currency }).format(minor / 10 ** fractionDigits(currency)),
    number: (n, opts = {}) => (n == null ? "" : new Intl.NumberFormat(locale, opts).format(n)),
    compact: (n) => (n == null ? "" : new Intl.NumberFormat(locale, { notation: "compact" }).format(n)),
    percent: (n, digits = 0) => (n == null ? "" : new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: digits }).format(n)),
    date: (iso, style = "short") => (iso ? new Intl.DateTimeFormat(locale, { dateStyle: style }).format(new Date(iso)) : ""),
    time: (iso) => (iso ? new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(new Date(iso)) : ""),
    datetime: (iso) => (iso ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : ""),
    relative: (iso) => {
      if (!iso) return "";
      const diff = new Date(iso) - ref;
      const [unit, ms] = units.find(([, ms]) => Math.abs(diff) >= ms) || ["minute", 6e4];
      return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(Math.round(diff / ms), unit);
    },
    // {{ 5 | plural({ one: "# сделка", few: "# сделки", many: "# сделок", other: "# сделки" }) }}
    plural: (n, forms) => {
      const form = forms[new Intl.PluralRules(locale).select(n)] ?? forms.other;
      return form.replace("#", new Intl.NumberFormat(locale).format(n));
    },
    initials: (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join(""),
    label: (obj) => (obj && typeof obj === "object" ? obj[(project.locale || "en").split("-")[0]] ?? Object.values(obj)[0] : obj),
  };
}

export function createEnv(root) {
  const project = loadProject(root);
  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.join(root, "src"), { noCache: true }), {
    autoescape: true,
    trimBlocks: true,
    lstripBlocks: true,
  });
  env.addGlobal("project", project);
  env.addGlobal("variants", loadVariants(root));
  env.addGlobal("data", loadData(root));
  env.addGlobal("icon", iconFactory(root));
  // Sample copy for the starter's matrix pages, in the interface language (falls back to English).
  const copyFile = path.join(root, "src/layouts/sample-copy.json");
  const copy = fs.existsSync(copyFile) ? readJson(copyFile) : {};
  env.addGlobal("sample", copy[(project.locale || "en").split("-")[0]] || copy.en || {});
  for (const [name, fn] of Object.entries(filters(project))) env.addFilter(name, fn);
  return env;
}

// ---------- render ----------
const errorPage = (title, err) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title></head><body><pre style="white-space:pre-wrap;color:#b91c1c;font:14px/1.5 monospace;padding:24px">Render error in ${title}\n\n${String(err.message || err).replace(/</g, "&lt;")}</pre></body></html>`;

export function renderAll(root, { strict = false } = {}) {
  const out = path.join(root, "frames");
  fs.rmSync(out, { recursive: true, force: true });
  const env = createEnv(root);
  const { flows, components } = loadCanvas(root);
  const expand = (frame, flow) =>
    frame.states.map((s) => ({
      id: frameFile(frame.id, s),
      page: frame.page,
      ctx: { frame, flow, view: s, scenario: frame.scenario || "typical", ...STATE_CONTEXT[s] },
    }));
  const jobs = [...flows.flatMap((flow) => flow.frames.flatMap((f) => expand(f, flow))), ...components.flatMap((c) => expand(c, null))];
  const files = [];
  const errors = [];
  for (const job of jobs) {
    const file = path.join(out, `${job.id}.html`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    let html;
    try {
      html = env.render(job.page, job.ctx);
    } catch (err) {
      errors.push(`${job.page} (${job.id}): ${err.message}`);
      html = errorPage(job.id, err);
    }
    fs.writeFileSync(file, html);
    files.push(file);
  }
  if (strict && errors.length) throw new Error(`Render failed:\n${errors.join("\n")}`);
  return { files, errors, manifest: { project: loadProject(root), flows, components } };
}
