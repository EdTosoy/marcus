// Unclocked local observations, separate from the fixed-date screenshot fixtures.
import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
const [before = "http://127.0.0.1:3458", after = "http://127.0.0.1:3460"] =
  process.argv.slice(2);
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  (existsSync("/etc/profiles/per-user/edtosoy/bin/chromium")
    ? "/etc/profiles/per-user/edtosoy/bin/chromium"
    : undefined);
const browser = await chromium.launch({
  executablePath,
  chromiumSandbox: true,
});
const results = [];
try {
  for (const base of [before, after]) {
    for (const path of ["/", "/learn", "/play", "/review", "/evaluation"]) {
      for (let sample = 1; sample <= 3; sample++) {
        const context = await browser.newContext({
          viewport: { width: 320, height: 900 },
          colorScheme: "light",
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        const errors = [];
        let engineRequests = 0;
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("request", (request) => {
          if (new URL(request.url()).pathname.startsWith("/engine/"))
            engineRequests++;
        });
        const response = await page.goto(base + path);
        await page.waitForLoadState("networkidle");
        const observed = await page.evaluate(() => {
          const navigation = performance.getEntriesByType("navigation")[0];
          const scripts = performance
            .getEntriesByType("resource")
            .filter((entry) => entry.initiatorType === "script");
          return {
            domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? null,
            jsEncodedBytes: scripts.reduce(
              (sum, entry) => sum + entry.encodedBodySize,
              0,
            ),
            headerHeight: document
              .querySelector("header")
              ?.getBoundingClientRect().height,
            boardWidth:
              document.querySelector(".chess-surface")?.getBoundingClientRect()
                .width ?? null,
            overflow: document.documentElement.scrollWidth > innerWidth,
          };
        });
        results.push({
          base,
          path,
          sample,
          status: response?.status(),
          engineRequests,
          errors,
          ...observed,
        });
        await context.close();
      }
    }
  }
  await mkdir("artifacts/phase2c/performance", { recursive: true });
  await writeFile(
    "artifacts/phase2c/performance/observations.json",
    JSON.stringify(
      {
        browser: browser.version(),
        conditions:
          "Local loopback, fresh browser contexts, 320px, no fake clock, no CPU/network throttling. Three observations per route, not a performance benchmark or device validation.",
        results,
      },
      null,
      2,
    ) + "\n",
  );
  if (
    results.some(
      (item) =>
        item.status !== 200 ||
        item.overflow ||
        item.errors.length ||
        item.engineRequests ||
        !item.domContentLoadedMs,
    )
  )
    throw new Error("Inspect the observed failures or unavailable timings.");
  console.log(`Recorded ${results.length} unclocked local observations.`);
} finally {
  await browser.close();
}
