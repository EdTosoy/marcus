import { chromium } from "@playwright/test";
import { Chess, DEFAULT_POSITION } from "chess.js";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const base = process.argv[2] ?? "http://127.0.0.1:3458";
const out = process.argv[3] ?? "artifacts/phase2c/before";
const dark = process.argv.includes("--dark");
await mkdir(out, { recursive: true });
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  (existsSync("/etc/profiles/per-user/edtosoy/bin/chromium")
    ? "/etc/profiles/per-user/edtosoy/bin/chromium"
    : undefined);
const browser = await chromium.launch({
  executablePath,
  chromiumSandbox: true,
});
const board = new Chess();
const moves = [];
for (const san of ["e4", "e5", "Qh5", "Nc6", "Qxe5+", "Nxe5"]) {
  const move = board.move(san);
  moves.push({ from: move.from, to: move.to });
}
const stamp = Date.UTC(2026, 9, 25, 10);
const saved = {
  version: 1,
  active: null,
  games: [
    {
      id: "visual-review",
      player: "w",
      difficulty: "gentle",
      startedAt: stamp,
      finishedAt: stamp + 10000,
      startingFen: DEFAULT_POSITION,
      moves,
      outcome: { result: "0-1", reason: "You resigned." },
    },
  ],
  reviews: {},
};
const results = [];
try {
  for (const width of [320, 375, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      colorScheme: dark ? "dark" : "light",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    let pageErrors = 0,
      consoleErrors = 0,
      failedRequests = 0,
      httpErrors = 0;
    const failureDetails = [];
    const cancelledPrefetches = [];
    page.on("pageerror", () => pageErrors++);
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors++;
    });
    page.on("requestfailed", (request) => {
      const detail = {
        path: new URL(request.url()).pathname,
        error: request.failure()?.errorText,
        prefetch: request.headers()["next-router-prefetch"] ?? null,
        rsc: request.headers().rsc ?? null,
      };
      if (
        detail.error === "net::ERR_ABORTED" &&
        detail.prefetch === "1" &&
        detail.rsc === "1"
      ) {
        cancelledPrefetches.push(detail);
      } else {
        failedRequests++;
        failureDetails.push(detail);
      }
    });
    page.on("response", (response) => {
      if (response.status() >= 400) httpErrors++;
    });
    await page.addInitScript(
      ({ saved, dark }) => {
        localStorage.setItem("marcus:games:v1", JSON.stringify(saved));
        localStorage.removeItem("quiet-chess:theme:v1");
        if (dark) localStorage.setItem("quiet-chess:theme:v1", "dark");
      },
      { saved, dark },
    );
    await page.clock.setFixedTime(stamp + 100000);
    async function capture(name, path, act) {
      if (path) await page.goto(base + path);
      if (act) await act();
      await page.waitForLoadState("networkidle");
      await page.locator("main").waitFor();
      await page.waitForTimeout(80);
      await page.screenshot({
        path: `${out}/${name}-${width}${dark ? "-dark" : ""}.png`,
        fullPage: true,
      });
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        boardWidth:
          document.querySelector(".chess-surface")?.getBoundingClientRect()
            .width ?? null,
        domContentLoadedMs:
          performance.getEntriesByType("navigation")[0]
            ?.domContentLoadedEventEnd ?? null,
        resources: performance.getEntriesByType("resource").length,
      }));
      results.push({
        name,
        width,
        theme: dark ? "dark" : "light",
        ...metrics,
        pageErrors,
        consoleErrors,
        failedRequests,
        httpErrors,
        failureDetails: [...failureDetails],
        cancelledPrefetches: [...cancelledPrefetches],
      });
    }
    await capture("lesson", "/");
    await capture("learning-home", "/learn");
    await capture("baseline", null, async () => {
      await page
        .getByRole("button", { name: "Start baseline", exact: true })
        .click();
    });
    await capture("guided-practice", null, async () => {
      for (let i = 0; i < 5; i++) {
        if (i)
          await page
            .getByRole("button", { name: "Continue baseline", exact: true })
            .click();
        await page
          .getByRole("button", { name: "I’m not sure", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Leave this check", exact: true })
          .click();
      }
      await page
        .getByRole("button", {
          name: "Start recommended exercise",
          exact: true,
        })
        .click();
    });
    await capture("progress", null, async () => {
      await page
        .getByRole("button", { name: "Learning progress", exact: true })
        .click();
    });
    await capture("play", "/play", async () => {
      await page
        .getByRole("button", { name: "Start game", exact: true })
        .click();
    });
    await capture("review", "/review?game=visual-review");
    await capture("evaluation", "/evaluation");
    await context.close();
  }
  const page = await browser.newPage({
    viewport: { width: 1000, height: 680 },
  });
  const sources = await Promise.all(
    [16, 32, 48, 192].map(async (size) => ({
      size,
      data: (
        await readFile(
          `assets/${size === 192 ? "icon-192" : `favicon-${size}x${size}`}.png`,
        )
      ).toString("base64"),
    })),
  );
  await page.setContent(
    `<html><body style="margin:0;font:16px system-ui"><h1 style="padding:20px">Supplied icon inspection — unchanged pixels</h1>${["#f7f8f3", "#101d17"].map((background) => `<section style="padding:24px;background:${background};color:${background === "#101d17" ? "white" : "black"};display:flex;align-items:start;gap:44px">${sources.map(({ size, data }) => `<figure style="margin:0"><img src="data:image/png;base64,${data}" width="${size}" height="${size}"/><figcaption>${size}px, opaque original</figcaption></figure>`).join("")}</section>`).join("")}</body></html>`,
  );
  await page.screenshot({
    path: `${out}/approved-icon-sizes.png`,
    fullPage: true,
  });
  await writeFile(
    `${out}/results.json`,
    JSON.stringify({ base, results }, null, 2) + "\n",
  );
  if (
    results.some(
      (item) =>
        item.overflow ||
        item.pageErrors ||
        item.consoleErrors ||
        item.failedRequests ||
        item.httpErrors,
    )
  )
    throw new Error(
      "Capture found overflow or runtime/request errors; inspect results.json.",
    );
  console.log(
    `Captured ${results.length} route states plus supplied icon inspection in ${out}.`,
  );
} finally {
  await browser.close();
}
