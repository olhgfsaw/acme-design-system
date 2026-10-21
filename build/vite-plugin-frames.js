// Vite plugin: renders Nunjucks frames before dev/build, re-renders on change, exposes the canvas manifest.
import path from "node:path";
import { renderAll } from "./render.js";

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
      const onChange = (file) => {
        if (!watched.test(file)) return;
        render();
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("change", onChange);
      server.watcher.on("add", onChange);
      server.watcher.on("unlink", onChange);
    },
  };
}
