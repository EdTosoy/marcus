import { expect, test, type Page } from "@playwright/test";
import { baseline, START } from "../../src/domain/adaptive/test-fixtures";
import {
  freshGameData,
  saveSession,
  serializeGames,
} from "../../src/infrastructure/game-progress";
import { moveInGame, newGame } from "../../src/domain/gameplay/session";

const KEY = "marcus:games:v1";
async function activate(page: Page, name: string | RegExp) {
  const button = page.getByRole("button", {
    name,
    exact: typeof name === "string",
  });
  if (test.info().project.name === "mobile") await button.tap();
  else await button.click();
}
async function move(page: Page, from: string, to: string) {
  await activate(page, new RegExp(`^${from} `));
  await activate(page, new RegExp(`^${to} `));
}
const workerScript = `
let position = "";
onmessage = ({data}) => {
  if(data === "uci") postMessage("uciok");
  if(data === "isready") postMessage("readyok");
  if(data.startsWith("position ")) position=data;
  if(data.startsWith("go ")) {
    const moves=(position.split(" moves ")[1] || "").trim().split(/\\s+/).filter(Boolean);
    const best = moves.length === 1 ? "e7e5" : moves.length === 3 ? "b8c6" : moves.length === 5 ? "c6e5" : "b1c3";
    setTimeout(() => { postMessage("info depth 6 multipv 1 score cp 20 pv " + best); postMessage("bestmove " + best); }, moves.length === 4 ? 600 : 80);
  }
};`;
async function mockEngine(page: Page) {
  await page.route("**/engine/stockfish-19-lite-single.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: workerScript }),
  );
}

test("real Stockfish worker: both colors, responsiveness, legal replies, resignation, persistence and PGN", async ({
  page,
}, info) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const workers: string[] = [];
  page.on("worker", (worker) => workers.push(worker.url()));
  await page.goto("/play");
  await expect(
    page.getByRole("heading", { name: "Choose your game" }),
  ).toBeVisible();
  expect(workers).toHaveLength(0);
  await page.getByLabel("Black", { exact: true }).check();
  await activate(page, "Start game");
  const animationFrames = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let frames = 0;
        const tick = () => {
          frames++;
          if (frames === 3) resolve(frames);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
  expect(animationFrames).toBe(3);
  await expect(
    page.getByRole("heading", { name: "Your decision" }),
  ).toBeVisible({ timeout: 30_000 });
  const blackGame = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    KEY,
  );
  expect(blackGame.active.player).toBe("b");
  expect(blackGame.active.moves).toHaveLength(1);
  await activate(page, "Resign game");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "You resigned." }),
  ).toBeVisible();
  await page.getByLabel("White", { exact: true }).check();
  await activate(page, "Start game");
  await move(page, "e2", "e4");
  await expect(
    page.getByRole("heading", { name: "Your decision" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).active.moves.length,
      KEY,
    ),
  ).toBe(2);
  await move(page, "g1", "f3");
  await expect(
    page.getByRole("heading", { name: "Your decision" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).active.moves.length,
      KEY,
    ),
  ).toBe(4);
  await page.screenshot({
    path: info.outputPath("real-stockfish-play.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await activate(page, "Pause game");
  await expect(
    page.getByRole("heading", { name: "Game paused" }),
  ).toBeVisible();
  await activate(page, "Resume game");
  await activate(page, "Resign game");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export PGN", exact: true })
    .first()
    .click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/\.pgn$/);
  expect(errors).toEqual([]);
  expect(workers.length).toBeLessThanOrEqual(2); // one per mounted game session, reused across normal searches
});

test("complete game, focused recovery, engine candidates, evidence separation and targeted practice", async ({
  page,
}, info) => {
  await page.clock.install({ time: START + 1000 });
  await mockEngine(page);
  await page.addInitScript(
    ({ learning }) =>
      localStorage.setItem("marcus:learning:v2", JSON.stringify(learning)),
    { learning: baseline() },
  );
  await page.goto("/play");
  await activate(page, "Start game");
  await move(page, "e2", "e4");
  await expect(
    page.getByRole("heading", { name: "Your decision" }),
  ).toBeVisible();
  await move(page, "d1", "h5");
  await expect(
    page.getByRole("heading", { name: "Your decision" }),
  ).toBeVisible();
  await move(page, "h5", "e5");
  await expect(
    page.getByRole("heading", { name: "Your decision" }),
  ).toBeVisible();
  await activate(page, "Resign game");
  await page.getByRole("link", { name: "Review this game" }).click();
  await expect(
    page.getByRole("heading", { name: "Before Qxe5+", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reveal and compare" }),
  ).toHaveCount(0);
  await expect(page.locator(".position-context strong")).toHaveText(
    "Original position",
  );
  await activate(page, "I looked for opponent threats");
  await expect(
    page.getByRole("button", { name: "Reveal and compare" }),
  ).toBeDisabled();
  await move(page, "h5", "e5");
  await expect(page.locator(".position-context strong")).toHaveText(
    "Candidate preview",
  );
  await activate(page, "Capture the moved piece");
  await expect(page.locator(".position-context strong")).toHaveText(
    "Your retry",
  );
  await expect(
    page.getByRole("heading", { name: "Inspect the destination again." }),
  ).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Inspect the destination again." }),
  ).toBeVisible();
  await activate(page, "A review hint");
  await activate(page, "Try the original position again");
  await expect(
    page.getByRole("button", { name: /^h5 white queen/ }),
  ).toBeFocused();
  await move(page, "h5", "h3");
  await expect(
    page.getByRole("heading", { name: "That meets the review goal." }),
  ).toBeVisible();
  await activate(page, "Reveal and compare");
  await activate(page, "Cancel analysis");
  await expect(
    page.getByText("Analysis cancelled. Your review attempts are preserved.", {
      exact: true,
    }),
  ).toBeVisible();
  await activate(page, "Reveal and compare");
  await expect(
    page.getByRole("heading", { name: "Engine-supported candidates" }),
  ).toBeVisible();
  await expect(
    page.getByText("This does not prove a forced loss", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Assisted successes: 1", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).runs.length,
      "marcus:learning:v2",
    ),
  ).toBe(5);
  await page.getByText("Replay the whole game", { exact: true }).click();
  await activate(page, "Next move");
  await expect(
    page.getByText("Position after 1 of 6 plies.", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("focused-game-review.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const downloadPromise = page.waitForEvent("download");
  await activate(page, "Export gameplay review (JSON)");
  const download = await downloadPromise;
  await download.saveAs(info.outputPath("gameplay-review.json"));
  await page.reload();
  await expect(
    page.getByText("Assisted successes: 1", { exact: false }),
  ).toBeVisible();
  await page.getByRole("link", { name: /^Practice Trace an attack/ }).click();
  await activate(page, "Start practice from game");
  await expect(
    page.getByText("Guided practice", { exact: true }),
  ).toBeVisible();
});

test("engine failure, restart, interruption and storage recovery", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/engine/stockfish-19-lite-single.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: fail
        ? 'throw new Error("Simulated worker failure");'
        : workerScript.replace("moves.length === 4 ? 600 : 80", "600"),
    }),
  );
  await page.goto("/play");
  await activate(page, "Start game");
  await move(page, "e2", "e4");
  await expect(page.locator(".input-notice[role='alert']")).toContainText(
    "Stockfish could not load",
  );
  fail = false;
  await activate(page, "Restart engine");
  await expect(
    page.getByRole("heading", { name: "Your decision" }),
  ).toBeVisible();
  await move(page, "d1", "h5");
  await activate(page, "Resign and restart");
  await expect(page.getByLabel("Move history", { exact: true })).toContainText(
    "No moves yet.",
  );
  await page.waitForTimeout(700); // The cancelled old worker would otherwise have replied by now.
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).active.moves.length,
      KEY,
    ),
  ).toBe(0);
  await activate(page, "Resign game");
  await expect(
    page.getByRole("heading", { name: "You resigned." }),
  ).toBeVisible();
  await page.waitForTimeout(150);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).active,
      KEY,
    ),
  ).toBeNull();
  await page.evaluate(
    (key) => localStorage.setItem(key, '{"version":99}'),
    KEY,
  );
  await page.reload();
  await expect(
    page.getByText("Saved game data is unsupported or damaged.", {
      exact: false,
    }),
  ).toBeVisible();
});

test("checkmate completion and review are persisted from legal full history", async ({
  page,
}) => {
  let game = newGame("fixture-mate", "w", "gentle", Date.now());
  game = moveInGame(game, { from: "f2", to: "f3" }, "learner", Date.now());
  game = moveInGame(game, { from: "e7", to: "e5" }, "engine", Date.now());
  game = moveInGame(game, { from: "g2", to: "g4" }, "learner", Date.now());
  const data = serializeGames(saveSession(freshGameData(), game));
  await page.route("**/engine/stockfish-19-lite-single.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: workerScript.replace(
        'moves.length === 3 ? "b8c6"',
        'moves.length === 3 ? "d8h4"',
      ),
    }),
  );
  await page.addInitScript(
    ({ data }) => localStorage.setItem("marcus:games:v1", data),
    { data },
  );
  await page.goto("/play");
  await expect(
    page.getByRole("heading", { name: "Checkmate. Black wins." }),
  ).toBeVisible();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    KEY,
  );
  expect(saved.active).toBeNull();
  expect(saved.games[0].moves).toHaveLength(4);
  await page.getByRole("link", { name: "Review this game" }).click();
  await page.getByText("Replay the whole game", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "1. f3", exact: true }),
  ).toBeVisible();
});

test("restart after reload preserves Black and the chosen difficulty", async ({
  page,
}) => {
  await mockEngine(page);
  await page.goto("/play");
  await page.getByLabel("Black", { exact: true }).check();
  await page.getByLabel("Approximate difficulty").selectOption("challenging");
  await activate(page, "Start game");
  await expect(
    page.getByRole("heading", { name: "Your decision" }),
  ).toBeVisible();
  await page.reload();
  await activate(page, "Resign and restart");
  await expect(
    page.getByRole("heading", { name: "Your decision" }),
  ).toBeVisible();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    KEY,
  );
  expect(saved.active).toMatchObject({
    player: "b",
    difficulty: "challenging",
  });
  expect(saved.active.moves).toHaveLength(1);
  expect(saved.games).toHaveLength(1);
});
