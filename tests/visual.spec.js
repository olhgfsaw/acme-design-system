// Screenshot baselines for APPROVED frames only. Record or update baselines with `npm run approve:visual`.
import { test, expect } from "@playwright/test";
import { frames, themes, heightFor } from "./frames.js";

const approved = frames.filter((f) => f.status === "approved");
test("there are approved frames", () => test.skip(approved.length === 0, "No approved frames yet"));

for (const f of approved) {
  for (const vp of f.viewports) {
    for (const theme of themes) {
      test(`${f.id} · ${vp}px · ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: vp, height: heightFor(f, vp) });
        await page.goto(`/frames/${f.id}.html?theme=${theme}`);
        await page.evaluate(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(`${f.id.replace(/\//g, "-")}-${vp}-${theme}.png`, { fullPage: true });
      });
    }
  }
}
