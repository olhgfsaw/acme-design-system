// Canvas viewer — a tool, not part of the design system. Design-system rules don't apply here.
import manifest from "virtual:canvas-manifest";

const KEY = "canvas-viewer";
const BASE = import.meta.env.BASE_URL; // "/" locally, "/<repo>/" on GitHub Pages
const EDITABLE = import.meta.env.DEV; // statuses can be written only by the local dev server
const defaults = { theme: "light", zoom: "0.5", status: "all", q: "", views: {} };
let state = { ...defaults };
try { state = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

const STATUSES = ["draft", "review", "approved", "deprecated"];
const STATE_LABELS = { default: "Default", loading: "Loading", empty: "Empty", "no-results": "No results", error: "Error", stress: "Stress" };
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const anchor = (id) => `frame-${id.replace(/[^\w-]/g, "-")}`;
const fileFor = (id, s) => (s && s !== "default" ? `${id}--${s}` : id);
const project = manifest.project || {};
const themes = () => (state.theme === "both" ? ["light", "dark"] : [state.theme]);
const viewOf = (f) => (f.states?.includes(state.views[f.id]) ? state.views[f.id] : "default");
const visible = (f) =>
  (state.status === "all" || (f.status || "draft") === state.status) &&
  (!state.q || `${f.id} ${f.title || ""}`.toLowerCase().includes(state.q.toLowerCase()));

function shots(f, { auto = false } = {}) {
  const viewports = auto ? [1024] : f.viewports || project.viewports || [1440];
  const file = fileFor(f.id, viewOf(f));
  return viewports
    .flatMap((vp) =>
      themes().map((t) => {
        const h = auto ? 400 : f.height || (vp < 768 ? 844 : 900);
        return `<figure class="shot">
          <figcaption>${vp}${auto ? "" : ` × ${h}`} · ${t}</figcaption>
          <iframe src="${BASE}frames/${esc(file)}.html?theme=${t}" width="${vp}" height="${h}" loading="lazy" title="${esc(f.title || f.id)} — ${vp}px, ${t}"${auto ? " data-auto" : ""}></iframe>
        </figure>`;
      }),
    )
    .join("");
}

function tabs(f) {
  if (!f.states || f.states.length < 2) return "";
  const current = viewOf(f);
  return `<div class="tabs" role="tablist" aria-label="States of ${esc(f.title || f.id)}">${f.states
    .map((s) => `<button type="button" role="tab" aria-selected="${s === current}" data-frame="${esc(f.id)}" data-view="${esc(s)}">${esc(STATE_LABELS[s] || s)}</button>`)
    .join("")}</div>`;
}

function card(f, opts) {
  const status = f.status || "draft";
  return `<article class="frame" id="${anchor(f.id)}">
    <header>
      <strong>${esc(f.title || f.id)}</strong>
      <code>${esc(f.id)}</code>
      ${EDITABLE ? "" : `<span class="status status-${esc(status)}">${esc(status)}</span>`}
      ${!EDITABLE ? "" : `<select class="status status-${esc(status)}" aria-label="Status of ${esc(f.title || f.id)}" data-status-kind="${f.id.startsWith("components/") ? "component" : "frame"}" data-status-id="${esc(f.id.startsWith("components/") ? f.title : f.id)}">${STATUSES.map((s) => `<option${s === status ? " selected" : ""}>${s}</option>`).join("")}</select>`}
      ${status === "approved" ? `<span class="hint">baseline: <code>npm run approve:visual</code></span>` : ""}
      <a href="${BASE}frames/${esc(fileFor(f.id, viewOf(f)))}.html?theme=${themes()[0]}" target="_blank" rel="noopener">Open ↗</a>
    </header>
    ${tabs(f)}
    <div class="shots">${shots(f, opts)}</div>
  </article>`;
}

function groups() {
  const flows = (manifest.flows || []).map((flow) => ({ ...flow, frames: (flow.frames || []).filter(visible) })).filter((flow) => flow.frames.length);
  const byCategory = {};
  for (const c of (manifest.components || []).filter(visible)) (byCategory[c.category] ??= []).push(c);
  return { flows, byCategory };
}

function nav({ flows, byCategory }) {
  const link = (f) => `<li><a href="#${anchor(f.id)}" data-jump="${anchor(f.id)}">${esc(f.title || f.id)}</a></li>`;
  return `<nav class="sidebar" aria-label="Canvas">
    ${flows.map((flow) => `<h2>${esc(flow.title || flow.id)}</h2><ul>${flow.frames.map(link).join("")}</ul>`).join("")}
    ${Object.keys(byCategory).length ? `<h2>Components</h2>${Object.entries(byCategory).map(([cat, list]) => `<h3>${esc(cat)}</h3><ul>${list.map(link).join("")}</ul>`).join("")}` : ""}
  </nav>`;
}

function render() {
  const g = groups();
  const empty = !(manifest.flows || []).length;
  document.title = `${project.product || "Design system"} — canvas`;
  document.querySelector("#app").innerHTML = `
    <header class="toolbar">
      <h1>${esc(project.product || "Design system")}</h1>
      <input type="search" id="q" placeholder="Search frames" value="${esc(state.q)}" aria-label="Search frames" />
      <label>Status <select id="status">${["all", "draft", "review", "approved", "deprecated"].map((s) => `<option${s === state.status ? " selected" : ""}>${s}</option>`).join("")}</select></label>
      <label>Theme <select id="theme">${["light", "dark", "both"].map((s) => `<option${s === state.theme ? " selected" : ""}>${s}</option>`).join("")}</select></label>
      <label>Zoom <select id="zoom">${["0.25", "0.5", "0.75", "1"].map((z) => `<option value="${z}"${z === state.zoom ? " selected" : ""}>${z * 100}%</option>`).join("")}</select></label>
    </header>
    <div class="layout">
      ${nav(g)}
      <main class="board" style="zoom:${state.zoom}">
        ${empty ? `<section class="flow empty"><h2>No screens yet</h2><p>Ask Claude, for example: “Create the Deals flow: list with all its data states, details drawer, kanban.” Screens appear here as soon as they are added to <code>src/canvas.json</code>.</p></section>` : ""}
        ${g.flows.map((flow) => `<section class="flow"><h2>${esc(flow.title || flow.id)}</h2><div class="row">${flow.frames.map((f) => card(f)).join("")}</div></section>`).join("")}
        ${Object.keys(g.byCategory).length ? `<section class="flow"><h2>Components</h2><div class="row">${Object.values(g.byCategory).flat().map((c) => card(c, { auto: true })).join("")}</div></section>` : ""}
      </main>
    </div>`;

  for (const id of ["status", "theme", "zoom"]) {
    document.getElementById(id).addEventListener("change", (e) => { state[id] = e.target.value; save(); render(); });
  }
  const q = document.getElementById("q");
  q.addEventListener("input", (e) => { state.q = e.target.value; save(); clearTimeout(q.t); q.t = setTimeout(() => { render(); document.getElementById("q").focus(); }, 250); });
  bindTabs(document);
  bindStatus(document);
  for (const a of document.querySelectorAll("[data-jump]")) {
    a.addEventListener("click", (e) => { e.preventDefault(); document.getElementById(a.dataset.jump)?.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" }); });
  }
  autoHeight(document);
}

// A state tab changes only its own frame: that one card is redrawn, every other frame keeps its iframes.
// Status picker: writes the status into src/canvas.json or src/components.json through the dev server.
function bindStatus(root) {
  for (const sel of root.querySelectorAll("select[data-status-id]")) {
    sel.addEventListener("change", async () => {
      const { statusKind: kind, statusId: id } = sel.dataset;
      const prev = [...sel.classList].find((c) => c.startsWith("status-"))?.slice(7);
      try {
        const r = await fetch("/__status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, id, status: sel.value }) });
        if (!r.ok) throw new Error((await r.json()).error);
      } catch (e) {
        sel.value = prev;
        alert(`Status not saved: ${e.message}. The picker works only with the dev server (npm run dev).`);
        return;
      }
      const list = kind === "component" ? manifest.components || [] : (manifest.flows || []).flatMap((flow) => flow.frames || []);
      const f = list.find((x) => (kind === "component" ? x.title : x.id) === id);
      if (f) f.status = sel.value;
      const article = sel.closest("article");
      if (f && article) {
        const tmp = document.createElement("div");
        tmp.innerHTML = card(f, kind === "component" ? { auto: true } : undefined);
        const head = tmp.querySelector("header");
        article.querySelector("header").replaceWith(head);
        bindStatus(head);
        head.querySelector("select")?.focus();
      }
    });
  }
}

function bindTabs(root) {
  for (const b of root.querySelectorAll("[data-view]")) {
    b.addEventListener("click", () => {
      const id = b.dataset.frame;
      state.views[id] = b.dataset.view;
      save();
      const screen = (manifest.flows || []).flatMap((flow) => flow.frames || []).find((f) => f.id === id);
      const component = screen ? null : (manifest.components || []).find((c) => c.id === id);
      const old = document.getElementById(anchor(id));
      if (!old || !(screen || component)) return render();
      const tmp = document.createElement("div");
      tmp.innerHTML = card(screen || component, component ? { auto: true } : undefined);
      const next = tmp.firstElementChild;
      old.replaceWith(next);
      bindTabs(next);
      bindStatus(next);
      autoHeight(next);
      next.querySelector(`[data-view="${CSS.escape(b.dataset.view)}"]`)?.focus();
    });
  }
}

function autoHeight(root) {
  for (const frame of root.querySelectorAll("iframe[data-auto]")) {
    frame.addEventListener("load", () => { try { frame.height = frame.contentDocument.documentElement.scrollHeight; } catch {} });
  }
}

render();
