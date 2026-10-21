// Claude Code PostToolUse hook (.claude/settings.json): after an edit to a design-system file,
// render + lint + check. Problems go back to Claude (exit code 2) so it fixes them before moving on.
import { execSync } from "node:child_process";

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let file = "";
  try { file = JSON.parse(input).tool_input?.file_path || ""; } catch {}
  if (!/[\\/]src[\\/].+\.(njk|json|css)$/.test(file)) process.exit(0);
  try {
    execSync("npm run -s lint && npm run -s check", { stdio: "pipe", cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd() });
    process.exit(0);
  } catch (e) {
    process.stderr.write(`Design-system checks failed after editing ${file}. Fix these before continuing (don't disable rules). Lint errors point to rendered files in /frames — fix the source template or variants map:\n${e.stdout || ""}${e.stderr || ""}`);
    process.exit(2);
  }
});
