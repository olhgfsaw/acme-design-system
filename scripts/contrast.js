// Checks WCAG 2.2 AA contrast for every semantic token pair, light and dark, straight from tokens.css.
// Used by `npm run check`; run alone with `node scripts/contrast.js` to see the full table.
import fs from "node:fs";

function oklchToSrgb(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return lin.map((v) => Math.min(1, Math.max(0, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
}

function parseColor(str) {
  const s = str.trim();
  if (s.startsWith("#")) {
    let h = s.slice(1);
    if (h.length === 3) h = [...h].map((c) => c + c).join("");
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  }
  const m = s.match(/oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/);
  if (m) return oklchToSrgb(m[2] ? +m[1] / 100 : +m[1], +m[3], +m[4]);
  throw new Error(`Unsupported color: ${s}`);
}

const linear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = ([r, g, b]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
const ratio = (x, y) => { const [a, b] = [luminance(x), luminance(y)].sort((p, q) => q - p); return (a + 0.05) / (b + 0.05); };
const over = (fg, bg) => fg.rgb.map((c, i) => c * fg.alpha + bg[i] * (1 - fg.alpha));

function blocks(css, selector) {
  const out = [];
  const re = new RegExp(`${selector}\\s*\\{([^}]*)\\}`, "g");
  for (const m of css.matchAll(re)) out.push(m[1]);
  return out.join("\n");
}
const vars = (body, prefix) => Object.fromEntries([...body.matchAll(new RegExp(`--(${prefix}[\\w-]*)\\s*:\\s*([^;]+);`, "g"))].map((m) => [m[1], m[2].trim()]));

export function contrastReport(css) {
  const palette = vars(blocks(css, ":root"), "palette-");
  const light = vars(blocks(css, "@theme"), "color-");
  const dark = { ...light, ...vars(blocks(css, "\\.dark"), "color-") };
  const resolve = (value) => {
    const mix = value.match(/color-mix\(in \w+,\s*var\(--([\w-]+)\)\s+([\d.]+)%,\s*transparent\)/);
    if (mix) return { rgb: parseColor(palette[mix[1]]), alpha: +mix[2] / 100 };
    const v = value.match(/^var\(--([\w-]+)\)$/);
    return { rgb: parseColor(v ? palette[v[1]] : value), alpha: 1 };
  };
  const rows = [];
  for (const [themeName, theme] of [["light", light], ["dark", dark]]) {
    const t = (name) => {
      if (!theme[`color-${name}`]) throw new Error(`tokens.css: --color-${name} is missing`);
      return resolve(theme[`color-${name}`]);
    };
    const surfaces = ["canvas", "surface", "surface-subtle", "surface-overlay"];
    const solid = (name) => t(name).rgb;
    const add = (fg, bg, bgName, min, fgName) => rows.push({ theme: themeName, pair: `${fgName} on ${bgName}`, ratio: ratio(over(fg, bg), bg), min });
    const tones = ["neutral", "info", "success", "warning", "danger"];
    for (const fg of ["fg", "fg-secondary", "fg-muted", "primary-fg", ...tones.map((x) => `${x}-fg`)])
      for (const s of surfaces) add(t(fg), solid(s), s, 4.5, fg);
    for (const tone of tones)
      for (const s of ["surface", "surface-overlay"]) {
        const bg = over(t(`${tone}-bg`), solid(s));
        add(t(`${tone}-fg`), bg, `${tone}-bg (over ${s})`, 4.5, `${tone}-fg`);
      }
    for (const fg of ["fg", "primary-fg"]) add(t(fg), over(t("primary-subtle"), solid("surface")), "primary-subtle (over surface)", 4.5, fg);
    for (const bg of ["primary", "primary-hover", "primary-active"]) add(t("on-primary"), solid(bg), bg, 4.5, "on-primary");
    for (const bg of ["danger-solid", "danger-solid-hover"]) add(t("on-danger"), solid(bg), bg, 4.5, "on-danger");
    for (const fg of ["control", "focus"]) for (const s of surfaces) add(t(fg), solid(s), s, 3, fg);
  }
  return rows;
}

export function checkContrast(css) {
  return contrastReport(css)
    .filter((r) => r.ratio < r.min)
    .map((r) => `contrast (${r.theme}): ${r.pair} = ${r.ratio.toFixed(2)}:1, needs ${r.min}:1 — adjust the palette step in tokens.css §1`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = contrastReport(fs.readFileSync("src/styles/tokens.css", "utf8"));
  for (const r of rows) console.log(`${r.ratio >= r.min ? "ok  " : "FAIL"} ${r.ratio.toFixed(2).padStart(5)}  ≥${r.min}  ${r.theme.padEnd(5)}  ${r.pair}`);
  const failed = rows.filter((r) => r.ratio < r.min).length;
  console.log(failed ? `\n${failed} pair(s) fail` : `\nAll ${rows.length} pairs pass`);
  process.exit(failed ? 1 : 0);
}
