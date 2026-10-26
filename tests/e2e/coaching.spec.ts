import { expect, test, type Page } from "@playwright/test";
import { coachingBenchmark } from "../../src/domain/coaching/benchmark";
import { newGame, moveInGame } from "../../src/domain/gameplay/session";
import {
  freshGameData,
  saveSession,
  serializeGames,
} from "../../src/infrastructure/game-progress";
import { acquisition, START } from "../../src/domain/adaptive/test-fixtures";
import { readFile } from "node:fs/promises";
async function activate(page: Page, name: string) {
  const target = page.getByRole("button", { name, exact: true });
  if (test.info().project.name === "mobile") await target.tap();
  else await target.click();
}
test("optional foreground timing and separate local evaluation export survive navigation", async ({
  page,
}, info) => {
  await page.clock.install({ time: START + 1000 });
  await page.addInitScript(
    (data) => localStorage.setItem("marcus:learning:v2", JSON.stringify(data)),
    acquisition(),
  );
  await page.goto("/evaluation");
  await expect(page.getByText("5 of 5", { exact: true })).toBeVisible();
  const metrics = (await page.locator(".evaluation-metrics").boundingBox())!;
  const content = (await page.locator(".evaluation-main").boundingBox())!;
  expect(metrics.width).toBeGreaterThan(content.width * 0.95);
  await page
    .locator("summary")
    .filter({ hasText: "Training timer (optional)" })
    .click();
  await activate(page, "Start training timer");
  await page.clock.fastForward(5000);
  await page.getByRole("link", { name: "Go to learning practice" }).click();
  await page.clock.fastForward(10_000);
  const menu = page.getByRole("button", { name: /^Menu/ });
  if (await menu.isVisible()) await menu.click();
  await page
    .locator("nav")
    .getByRole("link", { name: "Local results", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Pause training timer", exact: true })
    .first()
    .click();
  const promise = page.waitForEvent("download");
  await activate(page, "Export local evaluation (JSON)");
  const download = await promise;
  const path = info.outputPath("local-evaluation.json");
  await download.saveAs(path);
  const result = JSON.parse(await readFile(path, "utf8"));
  expect(result.baseline).toMatchObject({ correct: 5, total: 5 });
  expect(result.independentPostTrainingProxy).toMatchObject({
    correct: 2,
    total: 2,
    controlledStudyPostTest: false,
  });
  expect(result.trainingTime.measuredForegroundMs).toBeGreaterThanOrEqual(5000);
  expect(result.trainingTime.historicalActiveTime).toBeNull();
  expect(result.identityCollected).toBe(false);
  expect(result).not.toHaveProperty("email");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("marcus:learning:v2")!).runs.length,
    ),
  ).toBe(9);
  await page.reload();
  await page
    .locator("summary")
    .filter({ hasText: "Training timer (optional)" })
    .click();
  await expect(
    page.getByRole("button", { name: "Start training timer", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("local-evaluation.png"),
    fullPage: true,
  });
});
test("small-screen sacrifice coaching verifies mate, records a prediction, and gives no weakness prescription", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const scenario = coachingBenchmark.find(
    (item) => item.id === "smothered-sacrifice",
  )!;
  let game = newGame("sacrifice-benchmark", "w", "gentle", START, scenario.fen);
  game = moveInGame(game, scenario.candidate, "learner", START + 1);
  game = moveInGame(game, { from: "f8", to: "g8" }, "engine", START + 2);
  game = moveInGame(game, { from: "h6", to: "f7" }, "learner", START + 3);
  const data = serializeGames(saveSession(freshGameData(), game));
  await page.addInitScript(
    (data) => localStorage.setItem("marcus:games:v1", data),
    data,
  );
  await page.goto("/review");
  await expect(
    page.getByRole("heading", { name: "Before Qg8+", exact: true }),
  ).toBeVisible();
  await activate(page, "I looked for opponent threats");
  await page.getByRole("button", { name: /^e6 white queen/ }).click();
  await page.getByRole("button", { name: /^g8 empty/ }).click();
  const question = page.getByText(
    "After this candidate, what could your opponent do?",
    { exact: true },
  );
  await expect(question).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", {
      name: "A mating continuation is verified.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Verified legal line: Qg8+ → Rxg8 → Nf7#", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "This analysis opportunity has no targeted practice prescription.",
      { exact: false },
    ),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("marcus:games:v1")!),
  );
  expect(saved.reviews["sacrifice-benchmark:0"].attempts[0]).toMatchObject({
    prediction: "capture",
    coachingVersion: 2,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("sacrifice-review-320.png"),
    fullPage: true,
  });
});
test("320px keyboard underpromotion has usable controls and records the terminal draw", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const game = newGame(
    "promotion-probe",
    "w",
    "gentle",
    Date.now(),
    "7k/P7/8/8/8/8/8/7K w - - 0 1",
  );
  await page.addInitScript(
    (data) => localStorage.setItem("marcus:games:v1", data),
    serializeGames(saveSession(freshGameData(), game)),
  );
  await page.goto("/play");
  const pawn = page.getByRole("button", { name: /^a7 white pawn/ });
  await pawn.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  const knight = page.getByRole("button", { name: "knight", exact: true });
  await expect(knight).toBeVisible();
  expect((await knight.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await activate(page, "knight");
  await expect(
    page.getByRole("heading", {
      name: "Draw by insufficient material.",
      exact: true,
    }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("marcus:games:v1")!),
  );
  expect(saved.games[0].moves[0].promotion).toBe("n");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
