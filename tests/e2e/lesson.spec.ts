import { expect, test, type Page } from "@playwright/test";

async function activate(page: Page, label: string | RegExp) {
  const target = page.getByRole("button", { name: label });
  if (test.info().project.name === "mobile") await target.tap();
  else await target.click();
}
async function square(page: Page, squareName: string) {
  await activate(page, new RegExp(`^${squareName} `));
}
async function move(page: Page, from: string, to: string) {
  await square(page, from);
  await square(page, to);
}
async function begin(page: Page) {
  await page.goto("/");
  await activate(page, "Let’s try it");
}

test("complete lesson: mistakes, graduated hints, retry, reload, independent transfer, and reflection", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Is Your Piece Safe?" }),
  ).toBeVisible();
  await expect(
    page.getByText("A piece is attacked", { exact: false }),
  ).toBeVisible();
  await expect(page.locator('[data-square="a1"]')).toHaveAttribute(
    "data-row",
    "1",
  );
  await page.screenshot({
    path: testInfo.outputPath("introduction.png"),
    fullPage: true,
  });
  await activate(page, "Let’s try it");
  await expect(
    page.getByRole("heading", { name: "Find the threat" }),
  ).toBeFocused();
  await square(page, "d4");
  await expect(
    page.getByRole("heading", { name: "Pause and look again." }),
  ).toBeVisible();
  await activate(page, "A little guidance");
  await expect(page.getByText("Hint 1", { exact: true })).toBeVisible();
  await activate(page, "Another hint");
  await expect(page.getByText("Hint 2", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Pause and look again." }),
  ).toBeVisible();
  await expect(page.getByText("Hint 2", { exact: true })).toBeVisible();
  await activate(page, "Try again");
  await square(page, "d8");
  await expect(
    page.getByRole("heading", { name: "That’s the idea." }),
  ).toBeVisible();
  await activate(page, "Continue");

  await expect(
    page.getByRole("heading", { name: "Find a safe square" }),
  ).toBeVisible();
  await square(page, "c3");
  await expect(
    page.getByRole("button", { name: /^b4 .*legal destination/ }),
  ).toBeVisible();
  await square(page, "g7");
  await expect(
    page.getByRole("status").filter({ hasText: "king on g8" }),
  ).toBeVisible();
  await expect(page.getByLabel("Move history")).toHaveText("1. Bg7");
  await activate(page, "Undo");
  await expect(
    page.getByRole("button", { name: /^c3 white bishop/ }),
  ).toBeVisible();
  await move(page, "c3", "b4");
  await activate(page, "Continue");

  await move(page, "f3", "d4");
  await activate(page, "Continue");
  await move(page, "d4", "e4");
  await activate(page, "Continue");
  await move(page, "e4", "f5");
  await activate(page, "Continue");

  await expect(
    page.getByRole("heading", { name: "Your turn to apply it" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "A little guidance" }),
  ).toBeDisabled();
  await move(page, "c4", "c5");
  await activate(page, "See your reflection");
  await expect(
    page.getByRole("heading", { name: "You’re learning to look first." }),
  ).toBeVisible();
  await expect(
    page.getByText("Independent success", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("6 / 2", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Completion is a beginning.", { exact: true }),
  ).toBeVisible();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("quiet-chess:learning:v1")!),
  );
  expect(state.active.completed).toBe(true);
  expect(state.active.records["spot-the-rook"].hintsRevealed).toBe(2);
  expect(state.active.records["bishop-escape"].attempts).toHaveLength(2);
  await page.screenshot({
    path: testInfo.outputPath("reflection.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "You’re learning to look first." }),
  ).toBeVisible();
  await activate(page, "Practice this lesson again");
  await expect(
    page.getByRole("heading", { name: "First, notice the threat." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("narrow layout, readable instructions, board fits, reduced motion, and keyboard interaction", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({
    width: testInfo.project.name === "mobile" ? 375 : 1280,
    height: 900,
  });
  await begin(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const board = await page
    .getByLabel("Interactive chessboard", { exact: true })
    .boundingBox();
  expect(board).not.toBeNull();
  expect(board!.width).toBeLessThanOrEqual(
    await page.evaluate(() => window.innerWidth),
  );
  if (testInfo.project.name === "mobile") {
    const instructions = await page
      .getByText("Which black piece attacks", { exact: false })
      .boundingBox();
    expect(instructions!.y).toBeLessThan(board!.y);
  }
  const first = page.getByRole("button", { name: /^a1 empty/ });
  await first.focus();
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("button", { name: /^a2 empty/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Pause and look again." }),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("retry.png"),
    fullPage: true,
  });
});

test("corrupt and unavailable storage have recoverable states", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("quiet-chess:learning:v1", "{broken"),
  );
  await page.goto("/");
  await expect(
    page.getByText("The saved lesson could not be restored.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Let’s try it" }),
  ).toBeEnabled();
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Unavailable", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Unavailable", "SecurityError");
    };
  });
  await page.reload();
  await expect(
    page.getByText("Browser storage is unavailable.", { exact: false }),
  ).toBeVisible();
  await activate(page, "Let’s try it");
  await square(page, "d8");
  await expect(
    page.getByRole("heading", { name: "That’s the idea." }),
  ).toBeVisible();
});

test("a checking learner move names the opponent who is in check", async ({
  page,
}) => {
  await begin(page);
  await square(page, "d8");
  await activate(page, "Continue");
  await move(page, "c3", "b4");
  await activate(page, "Continue");
  await move(page, "f3", "d4");
  await activate(page, "Continue");
  await move(page, "d4", "d8");
  await expect(
    page.getByText("Black to move, in check.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Move history")).toHaveText("1. Rd8+");
});
