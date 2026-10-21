// Every frame the canvas shows — screens from src/canvas.json and component matrices — in every declared state.
import { loadCanvas, loadProject, frameFile } from "../build/render.js";

const root = process.cwd();
const project = loadProject(root);
const { flows, components } = loadCanvas(root);

const expand = (f, viewports) => f.states.map((s) => ({ id: frameFile(f.id, s), status: f.status || "draft", viewports, height: f.height }));

export const frames = [
  ...flows.flatMap((flow) => flow.frames.flatMap((f) => expand(f, f.viewports || project.viewports || [1440]))),
  ...components.flatMap((c) => expand(c, [1024])),
];
export const themes = ["light", "dark"];
export const heightFor = (f, vp) => f.height || (vp < 768 ? 844 : 900);
