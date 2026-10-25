import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { foundationExercises as bank } from "../../src/domain/curriculum/foundations";
import { responseOptions } from "../../src/domain/learning/validation";
import { DAY } from "../../src/domain/adaptive/model";
import { freshProgress } from "../../src/infrastructure/local-progress";
import { pieceSafetyLesson } from "../../src/domain/curriculum/piece-safety";
import type {
  FoundationExercise,
  LearningData,
} from "../../src/domain/adaptive/types";

const START = new Date("2026-10-25T10:00:00Z");
const KEY = "marcus:learning:v2";
async function activate(page: Page, name: string | RegExp) {
  const button = page.getByRole("button", {
    name,
    exact: typeof name === "string",
  });
  if (test.info().project.name === "mobile") await button.tap();
  else await button.click();
}
async function data(page: Page): Promise<LearningData> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), KEY);
}
async function current(page: Page): Promise<FoundationExercise> {
  const saved = await data(page);
  return bank.find(
    (item) =>
      item.id ===
      saved.runs.find((run) => run.id === saved.activeRunId)?.exerciseId,
  )!;
}
async function answer(
  page: Page,
  exercise: FoundationExercise,
  response = exercise.review.validExamples[0]!,
) {
  if (response.type === "square")
    await activate(page, new RegExp(`^${response.square} `));
  else if (response.type === "move") {
    await activate(page, new RegExp(`^${response.move.from} `));
    await activate(page, new RegExp(`^${response.move.to} `));
  } else if (response.type === "choice")
    await activate(
      page,
      responseOptions(exercise).find((option) => option.id === response.choice)!
        .label,
    );
  else await activate(page, "I’m not sure");
}
async function leave(page: Page, exercise: FoundationExercise) {
  await activate(
    page,
    exercise.role === "guided" ? "Choose next practice" : "Leave this check",
  );
}

test("baseline, reflective guided retry, varied transfer, real-interval review, progress and anonymous export", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.clock.install({ time: START });
  await page.goto("/learn");
  await activate(page, "Start baseline");
  for (let i = 0; i < 5; i++) {
    if (i) await activate(page, "Continue baseline");
    const exercise = await current(page);
    expect(exercise.role).toBe("diagnostic");
    await expect(
      page.getByRole("button", { name: "A little guidance", exact: true }),
    ).toHaveCount(0);
    await answer(page, exercise);
    await expect(
      page.getByRole("heading", { name: "Answer recorded.", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(exercise.correctExplanation, { exact: true }),
    ).toHaveCount(0);
    if (!i) {
      await activate(page, "Learning progress");
      await expect(
        page.getByText("Finish the five baseline decisions", { exact: false }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Export local results (JSON)" }),
      ).toHaveCount(0);
      await activate(page, "Practice");
    }
    await leave(page, exercise);
  }
  await activate(page, "Start recommended exercise");
  const guided = await current(page);
  expect(guided.role).toBe("guided");
  await answer(page, guided, guided.review.invalidExamples[0]!);
  await expect(
    page.getByRole("button", { name: "Recheck and try again" }),
  ).toBeDisabled();
  await activate(page, "A little guidance");
  await page.reload();
  await expect(page.getByText("Hint 1", { exact: true })).toBeVisible();
  await activate(page, "I checked attacks only");
  await activate(page, "Recheck and try again");
  await answer(page, guided);
  await expect(
    page.getByRole("heading", { name: "That meets the goal." }),
  ).toBeVisible();
  await leave(page, guided);
  for (let i = 0; i < 25; i++) {
    const saved = await data(page);
    if (
      saved.runs.filter(
        (run) =>
          run.finishedAt !== null &&
          bank.find((item) => item.id === run.exerciseId)?.role === "transfer",
      ).length === 10
    )
      break;
    await activate(page, "Start recommended exercise");
    const exercise = await current(page);
    expect(exercise.role).not.toBe("delayed");
    await answer(page, exercise);
    await leave(page, exercise);
  }
  let saved = await data(page);
  expect(
    saved.runs.filter(
      (run) =>
        bank.find((item) => item.id === run.exerciseId)?.role === "transfer",
    ),
  ).toHaveLength(10);
  await activate(page, "Learning progress");
  await expect(page.getByText("Developing", { exact: true })).toHaveCount(5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("evidence-before-review.png"),
    fullPage: true,
  });
  await activate(page, "Practice");
  await page.clock.fastForward(DAY + 60_000);
  await activate(page, "Start recommended exercise");
  const review = await current(page);
  expect(review.role).toBe("delayed");
  await expect(page.getByText("Delayed review", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "A little guidance", exact: true }),
  ).toHaveCount(0);
  await answer(page, review);
  await leave(page, review);
  await activate(page, "Learning progress");
  await expect(page.getByText("Demonstrated", { exact: true })).toHaveCount(1);
  await expect(
    page.getByText("They are not a chess rating", { exact: false }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await activate(page, "Export local results (JSON)");
  const download = await downloadPromise;
  const path = testInfo.outputPath("anonymous-results.json");
  await download.saveAs(path);
  const exported = JSON.parse(await readFile(path, "utf8"));
  expect(
    exported.observations.filter(
      (item: { role: string }) => item.role === "diagnostic",
    ),
  ).toHaveLength(5);
  expect(
    exported.observations.find(
      (item: { role: string }) => item.role === "delayed",
    ),
  ).toMatchObject({ delayedEligible: true, independent: true });
  expect(exported).not.toHaveProperty("name");
  await page.screenshot({
    path: testInfo.outputPath("evidence-after-review.png"),
    fullPage: true,
  });
  await page.reload();
  saved = await data(page);
  expect(saved.runs).toHaveLength(26);
  expect(errors).toEqual([]);
});

test("legacy migration, corrupt adaptive fallback and original lesson remain intact", async ({
  page,
}) => {
  const original = JSON.stringify(freshProgress(pieceSafetyLesson));
  await page.addInitScript(
    ({ original, key }) => {
      localStorage.setItem("quiet-chess:learning:v1", original);
      localStorage.setItem(key, '{"schemaVersion":999}');
    },
    { original, key: KEY },
  );
  await page.goto("/learn");
  await expect(
    page.getByText("The adaptive record is unsupported or damaged.", {
      exact: false,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("quiet-chess:learning:v1")),
  ).toBe(original);
  await activate(page, "Start baseline");
  await activate(page, "I’m not sure");
  await expect(
    page.getByRole("heading", { name: "Answer recorded." }),
  ).toBeVisible();
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Let’s try it" }),
  ).toBeEnabled();
});

test("keyboard, reduced motion, readable phone layout and unavailable storage", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({
    width: testInfo.project.name === "mobile" ? 375 : 1280,
    height: 900,
  });
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Unavailable", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Unavailable", "SecurityError");
    };
  });
  await page.goto("/learn");
  await expect(
    page.getByText("Browser storage is unavailable.", { exact: false }),
  ).toBeVisible();
  await activate(page, "Start baseline");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const instruction = await page
    .locator(".adaptive-task .instruction")
    .boundingBox();
  const board = await page
    .getByLabel("Interactive chessboard", { exact: true })
    .boundingBox();
  expect(instruction!.y).toBeLessThan(board!.y);
  const square = page.getByRole("button", { name: /^a1 empty/ });
  await square.focus();
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("button", { name: /^a2 empty/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Answer recorded." }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("sealed-baseline.png"),
    fullPage: true,
  });
});
