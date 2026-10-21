// axe-core on every frame × viewport × theme. WCAG 2.2 AA.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { frames, themes, heightFor } from "./frames.js";

for (const f of frames) {
  for (const vp of f.viewports) {
    for (const theme of themes) {
      test(`${f.id} · ${vp}px · ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: vp, height: heightFor(f, vp) });
        await page.goto(`/frames/${f.id}.html?theme=${theme}`);
        const { violations, incomplete } = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        // axe marks some contrast results "needs review" (for example a 1:1 ratio) — treat those as failures too.
        const unsure = incomplete.filter((r) => r.id === "color-contrast");
        const report = [...violations, ...unsure].map((v) => `${v.id}: ${v.help}\n    ${v.nodes.slice(0, 5).map((n) => n.target.join(" ")).join("\n    ")}`);
        expect(report, `Accessibility violations in ${f.id} (${vp}px, ${theme}):\n${report.join("\n")}`).toEqual([]);
      });
    }
  }
}
