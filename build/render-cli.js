// `npm run render` / `npm run lint`: renders all frames to /frames and fails on template errors.
import { renderAll } from "./render.js";

const { files, errors } = renderAll(process.cwd());
if (errors.length) {
  console.error(`Template errors:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Rendered ${files.length} frame(s) to /frames`);
