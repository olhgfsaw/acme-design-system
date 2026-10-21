// `npm run check`: project settings, token contrast, schemas ↔ fixtures ↔ statuses ↔ views, markup ↔ component registry.
import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { renderAll, loadData, loadVariants, loadCanvas, walk, DATA_STATES, frameFile } from "../build/render.js";
import { checkContrast } from "./contrast.js";

const root = process.cwd();
const errors = [];
const warnings = [];
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const SCENARIOS = ["typical", "empty", "longStrings", "largeNumbers", "partial", "many"];

// 1. Project settings
const project = readJson("src/project.json");
for (const key of ["product", "locale", "currency"]) if (!project[key]) warnings.push(`src/project.json: "${key}" is not set — run /bootstrap or fill it in`);

// 2. Token contrast
errors.push(...checkContrast(fs.readFileSync(path.join(root, "src/styles/tokens.css"), "utf8")));

// 3. Data contracts
const data = loadData(root);
const tones = Object.keys(loadVariants(root).badge?.variants?.tone || {});
const statuses = data.statuses || {};
for (const [dict, entries] of Object.entries(statuses)) {
  for (const [code, s] of Object.entries(entries)) {
    if (!s.label) errors.push(`statuses.json ${dict}.${code}: missing "label"`);
    if (!tones.includes(s.tone)) errors.push(`statuses.json ${dict}.${code}: tone "${s.tone}" is not one of ${tones.join(", ")}`);
  }
}
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
for (const file of walk(path.join(root, "src/data/schemas"), (p) => p.endsWith(".schema.json"))) {
  const entity = path.basename(file, ".schema.json");
  const rel = path.relative(root, file);
  const schema = JSON.parse(fs.readFileSync(file, "utf8"));
  let validate;
  try { validate = ajv.compile(schema); } catch (e) { errors.push(`${rel}: invalid schema — ${e.message}`); continue; }

  // dictionaries: properties with "x-dict" must match statuses.json exactly
  for (const [prop, def] of Object.entries(schema.properties || {})) {
    if (!def["x-dict"]) continue;
    const dict = statuses[def["x-dict"]];
    if (!dict) { errors.push(`${rel}: ${prop} uses x-dict "${def["x-dict"]}" which is missing in statuses.json`); continue; }
    const en = new Set(def.enum || []), keys = new Set(Object.keys(dict));
    const missing = [...en].filter((c) => !keys.has(c)), extra = [...keys].filter((c) => !en.has(c));
    if (missing.length || extra.length) errors.push(`${rel}: ${prop} enum and statuses.json "${def["x-dict"]}" differ (only in enum: ${missing.join(", ") || "—"}; only in statuses: ${extra.join(", ") || "—"})`);
  }

  const fixture = data.fixtures?.[camel(entity)];
  if (!fixture) { errors.push(`${rel}: no fixtures/${entity}.json`); continue; }
  for (const sc of SCENARIOS) if (!Array.isArray(fixture.scenarios?.[sc])) errors.push(`fixtures/${entity}.json: scenario "${sc}" is missing`);
  for (const [sc, records] of Object.entries(fixture.scenarios || {})) {
    const found = new Map(); // same problem in many records → reported once with a count
    (records || []).forEach((r, i) => {
      if (validate(r)) return;
      for (const e of validate.errors) {
        const key = `${e.instancePath || "/"}: ${e.message}${e.params?.additionalProperty ? ` ("${e.params.additionalProperty}")` : ""}`;
        const hit = found.get(key) || { first: i, count: 0 };
        hit.count++;
        found.set(key, hit);
      }
    });
    for (const [key, { first, count }] of found) errors.push(`fixtures/${entity}.json ${sc}[${first}]${count > 1 ? ` (+${count - 1} more)` : ""} ${key}`);
  }

  for (const [viewName, view] of Object.entries(data.views?.[camel(entity)] || {})) {
    const where = `views/${entity}.${viewName}.json`;
    if (view.view === "kanban" || view.groupBy) {
      const dict = statuses[view.dict] || {};
      for (const col of view.columns || []) if (typeof col !== "string" || !dict[col]) errors.push(`${where}: column ${JSON.stringify(col)} must be a status code from statuses.json "${view.dict}"`);
    } else {
      for (const col of view.columns || []) if (col.key !== "actions" && !(schema.properties || {})[col.key]) errors.push(`${where}: column "${col.key}" is not a property of ${entity}`);
    }
  }
}

// 4. Markup ↔ component registry
const registry = readJson("src/components.json");
for (const [name, entry] of Object.entries(registry)) {
  if (!entry.path || !fs.existsSync(path.join(root, entry.path))) errors.push(`components.json ${name}: path "${entry.path}" does not exist`);
}
const { files, errors: renderErrors } = renderAll(root);
errors.push(...renderErrors.map((e) => `render: ${e}`));
for (const file of files) {
  const htmlText = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file);
  for (const [tag] of htmlText.matchAll(/<[a-zA-Z][^>]*\sdata-component="[^"]*"[^>]*>/g)) {
    const attr = (n) => tag.match(new RegExp(`\\sdata-${n}="([^"]*)"`))?.[1];
    const name = attr("component");
    const entry = registry[name];
    if (!entry) { errors.push(`${rel}: data-component="${name}" is not registered in src/components.json`); continue; }
    for (const key of ["variant", "size", "tone"]) {
      const value = attr(key);
      if (value === undefined) continue;
      const allowed = entry.variants?.[key];
      if (!allowed) errors.push(`${rel}: ${name} has data-${key}="${value}" but components.json lists no "${key}" variants`);
      else if (!allowed.includes(value)) errors.push(`${rel}: ${name} data-${key}="${value}" is not one of ${allowed.join(", ")}`);
    }
  }
}

// 5. Data states: only known names, and every declared state must actually render differently from default
const { flows, components } = loadCanvas(root);
const strip = (s) => s.replace(/<title>[\s\S]*?<\/title>/, "");
for (const f of [...flows.flatMap((fl) => fl.frames), ...components]) {
  const where = f.id.startsWith("components/") ? `components.json ${f.title} dataStates` : `canvas.json ${f.id} states`;
  for (const s of f.states) if (!DATA_STATES.includes(s)) errors.push(`${where}: unknown state "${s}" (use ${DATA_STATES.join(", ")})`);
  if (f.states.length < 2) continue;
  const read = (s) => { try { return strip(fs.readFileSync(path.join(root, "frames", `${frameFile(f.id, s)}.html`), "utf8")); } catch { return null; } };
  const base = read("default");
  for (const s of f.states.slice(1)) {
    if (DATA_STATES.includes(s) && base !== null && read(s) === base)
      errors.push(`${where}: "${s}" renders exactly like default — branch on \`state\` (or use \`scenario\` data for stress) in ${f.page}`);
  }
}

// Output
const uniq = (a) => [...new Set(a)];
for (const w of uniq(warnings)) console.warn(`warning  ${w}`);
for (const e of uniq(errors)) console.error(`error    ${e}`);
if (errors.length) { console.error(`\n✖ ${uniq(errors).length} problem(s)`); process.exit(1); }
console.log(`✓ check passed (${files.length} frame(s), ${Object.keys(registry).length} component(s))`);
