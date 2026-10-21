// Vite plugin: renders Nunjucks frames before dev/build, re-renders on change, exposes the canvas manifest.
import fs from "node:fs";
import path from "node:path";
import { renderAll } from "./render.js";

const STATUSES = ["draft", "review", "approved", "deprecated"];

const VIRTUAL = "virtual:canvas-manifest";
const RESOLVED = "\0" + VIRTUAL;

export default function frames() {
  let root = process.cwd();
  let manifest = { project: {}, flows: [], components: [] };
  let isBuild = false;

  const render = () => {
    const result = renderAll(root, { strict: isBuild });
    manifest = result.manifest;
    if (result.errors.length) console.error(`\n[frames] Template errors:\n- ${result.errors.join("\n- ")}\n`);
    return result.files;
  };

  return {
    name: "design-system-frames",
    config(config, { command }) {
      root = path.resolve(config.root || process.cwd());
      isBuild = command === "build";
      const files = render();
      const input = { canvas: path.join(root, "index.html") };
      for (const f of files) input[path.relative(root, f).replace(/\.html$/, "")] = f;
      return { build: { rollupOptions: { input } } };
    },
    resolveId(id) {
      if (id === VIRTUAL) return RESOLVED;
    },
    load(id) {
      if (id === RESOLVED) return `export default ${JSON.stringify(manifest)};`;
    },
    configureServer(server) {
      const watched = /[\\/]src[\\/].*\.(njk|json)$/;
      let quietUntil = 0; // a status change from the canvas updates the manifest without reloading the page
      const onChange = (file) => {
        if (!watched.test(file)) return;
        render();
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) server.moduleGraph.invalidateModule(mod);
        if (Date.now() > quietUntil) server.ws.send({ type: "full-reload" });
      };

      // POST /__status { kind: "frame" | "component", id, status } — the canvas status picker writes
      // the status into src/canvas.json (screens) or src/components.json (components).
      server.middlewares.use("/__status", (req, res) => {
        const reply = (code, body) => { res.statusCode = code; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(body)); };
        if (req.method !== "POST") return reply(405, { error: "POST only" });
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", () => {
          try {
            const { kind, id, status } = JSON.parse(body || "{}");
            if (!STATUSES.includes(status)) return reply(400, { error: `status must be one of ${STATUSES.join(", ")}` });
            const file = path.join(root, "src", kind === "component" ? "components.json" : "canvas.json");
            const json = JSON.parse(fs.readFileSync(file, "utf8"));
            let entry;
            if (kind === "component") entry = json[id];
            else for (const flow of json.flows || []) entry ??= (flow.frames || []).find((f) => f.id === id);
            if (!entry) return reply(404, { error: `${kind} "${id}" not found` });
            entry.status = status;
            quietUntil = Date.now() + 2000;
            fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
            reply(200, { ok: true, status });
          } catch (e) {
            reply(500, { error: e.message });
          }
        });
      });
      server.watcher.on("change", onChange);
      server.watcher.on("add", onChange);
      server.watcher.on("unlink", onChange);
    },
  };
}
