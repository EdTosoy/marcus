import { expect, test, type Page } from "@playwright/test";
import { newGame } from "../../src/domain/gameplay/session";
import {
  freshGameData,
  saveSession,
  serializeGames,
} from "../../src/infrastructure/game-progress";

const square = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp(`^${name} `) });
const board = (page: Page) =>
  page.getByRole("group", { name: "Interactive chessboard", exact: true });
async function load(page: Page, fen: string) {
  await page.getByLabel("Load a position (FEN)").fill(fen);
  await page
    .getByRole("button", { name: "Load position", exact: true })
    .click();
}
async function move(page: Page, from: string, to: string) {
  await square(page, from).click();
  await square(page, to).click();
}

test("one accessible control per square and one sequential board stop", async ({
  page,
}) => {
  await page.goto("/board");
  await expect(board(page).getByRole("button")).toHaveCount(64);
  await expect(board(page)).toHaveAccessibleDescription(
    /White to move.*White at the bottom/,
  );
  await expect(
    board(page).locator(
      '[data-board-square] [role="button"], [data-board-square] button, .piece-visual [tabindex]',
    ),
  ).toHaveCount(0);
  await expect(
    board(page).locator('[data-board-square][tabindex="0"]'),
  ).toHaveCount(1);
  await expect(square(page, "e2")).toHaveAccessibleName("e2 white pawn");
  await square(page, "a1").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Flip board" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(square(page, "a1")).toBeFocused();
});

test("orientation-aware exploration, boundaries, selection, invalid move and destination focus", async ({
  page,
}) => {
  await page.goto("/board");
  await square(page, "a1").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(square(page, "a1")).toBeFocused();
  await page.keyboard.press("Control+Home");
  await expect(square(page, "a8")).toBeFocused();
  await page.keyboard.press("End");
  await expect(square(page, "h8")).toBeFocused();
  await page.keyboard.press("Control+End");
  await expect(square(page, "h1")).toBeFocused();
  await square(page, "e2").focus();
  await page.keyboard.press("Space");
  await expect(square(page, "e2")).toHaveAttribute("aria-pressed", "true");
  await square(page, "e5").focus();
  await page.keyboard.press("Enter");
  await expect(square(page, "e5")).toBeFocused();
  await expect(square(page, "e2")).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("status").filter({ hasText: "That move is not legal" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(square(page, "e2")).toBeFocused();
  await expect(square(page, "e2")).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Space");
  await expect(square(page, "e4")).toBeFocused();
  await expect(square(page, "e4")).toHaveAccessibleName(
    /white pawn.*last move to/,
  );
  await expect(page.getByLabel("Move history", { exact: true })).toHaveText(
    "1. e4 ",
  );
  await page.getByRole("button", { name: "Flip board" }).click();
  await expect(page.getByRole("button", { name: "Flip board" })).toBeFocused();
  await square(page, "e4").focus();
  await page.keyboard.press("ArrowRight");
  await expect(square(page, "d4")).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(square(page, "d3")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(square(page, "h3")).toBeFocused();
});

test("promotion focuses choices, Escape/cancel returns source, keyboard underpromotion returns destination", async ({
  page,
}) => {
  await page.goto("/board");
  await load(page, "7k/P7/8/8/8/8/8/7K w - - 0 1");
  await move(page, "a7", "a8");
  await expect(
    page.getByRole("button", { name: "queen", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("group", { name: "Promote your pawn to…" }),
  ).toHaveAccessibleDescription(/a7 to a8/);
  await page.keyboard.press("Shift+Tab");
  await expect(square(page, "a8")).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(square(page, "b8")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "queen", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "rook", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(square(page, "a7")).toBeFocused();
  await expect(
    page.getByRole("group", { name: "Promote your pawn to…" }),
  ).toHaveCount(0);
  await move(page, "a7", "a8");
  await page.getByRole("button", { name: "Cancel promotion" }).click();
  await expect(square(page, "a7")).toBeFocused();
  await move(page, "a7", "a8");
  for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "knight", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(square(page, "a8")).toBeFocused();
  await expect(square(page, "a8")).toHaveAccessibleName(/white knight/);
  await expect(page.getByLabel("Move history", { exact: true })).toContainText(
    "a8=N",
  );
  await expect(board(page)).toHaveAccessibleDescription(
    /Draw by insufficient material/,
  );
  const data = serializeGames(
    saveSession(
      freshGameData(),
      newGame(
        "a11y-promotion",
        "w",
        "getting-started",
        Date.now(),
        "7k/P7/8/8/8/8/8/7K w - - 0 1",
      ),
    ),
  );
  await page.evaluate(
    (data) => localStorage.setItem("marcus:games:v1", data),
    data,
  );
  await page.goto("/play");
  await move(page, "a7", "a8");
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  await expect(
    page.getByRole("group", { name: "Promote your pawn to…" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Resume game", exact: true }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("marcus:games:v1")!).active.moves,
    ),
  ).toHaveLength(0);
  await page.getByRole("button", { name: "Resume game", exact: true }).click();
  await move(page, "a7", "a8");
  await page.getByRole("button", { name: "knight", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Draw by insufficient material.",
      exact: true,
    }),
  ).toBeFocused();
});

test("same-FEN reset clears selection/promotion without moving external focus; disabling reset restores board focus", async ({
  page,
}) => {
  await page.goto("/board");
  const fen = "7k/P7/8/8/8/8/8/7K w - - 0 1";
  await load(page, fen);
  await square(page, "a7").click();
  await load(page, fen);
  await expect(square(page, "a7")).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("button", { name: "Load position", exact: true }),
  ).toBeFocused();
  await move(page, "a7", "a8");
  await load(page, fen);
  await expect(
    page.getByRole("group", { name: "Promote your pawn to…" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Return to starting position" })
    .click();
  await move(page, "e2", "e4");
  await page
    .getByRole("button", { name: "Restart position", exact: true })
    .click();
  await expect(square(page, "e4")).toBeFocused();
  await expect(square(page, "e2")).toHaveAccessibleName("e2 white pawn");
  await move(page, "e2", "e4");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(square(page, "e4")).toBeFocused();
});

test("lesson question precedes board in reading/Tab order, answer retains focus, retry and next are intentional", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Let’s try it", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Find the threat", exact: true }),
  ).toBeFocused();
  const question = await page.locator("#task-title").boundingBox();
  const instruction = await page
    .locator(".guided-workbench .instruction")
    .boundingBox();
  expect(question!.y).toBeLessThan(instruction!.y);
  expect(
    await page
      .locator("#task-title")
      .evaluate((el) =>
        Boolean(
          el.compareDocumentPosition(
            document.querySelector(".chess-surface")!,
          ) & Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(square(page, "a1")).toBeFocused();
  await square(page, "d4").focus();
  await page.keyboard.press("Enter");
  await expect(square(page, "d4")).toBeFocused();
  await expect(square(page, "d4")).toBeDisabled();
  await page.keyboard.press("ArrowLeft");
  await expect(square(page, "c4")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Pause and look again." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(square(page, "c4")).toBeFocused();
  await square(page, "d8").click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Find a safe square", exact: true }),
  ).toBeFocused();
  const records = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("quiet-chess:learning:v1")!).active
        .records["spot-the-rook"],
  );
  expect(records.attempts).toHaveLength(2);
  expect(records.hintsRevealed).toBe(0);
});

test("independent square answers commit once and preserve the focused locked square", async ({
  page,
}) => {
  await page.goto("/learn");
  await page
    .getByRole("button", { name: "Start baseline", exact: true })
    .click();
  await square(page, "a2").focus();
  await page.keyboard.press("Space");
  await expect(square(page, "a2")).toBeFocused();
  await expect(square(page, "a2")).toBeDisabled();
  await page.keyboard.press("Enter");
  const attempts = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("marcus:learning:v2")!);
    return data.runs.find((run: { id: string }) => run.id === data.activeRunId)
      .attempts;
  });
  expect(attempts).toHaveLength(1);
});

test("opaque move/capture markers and focus have 3:1 contrast in both themes; states have non-color labels", async ({
  page,
}) => {
  for (const theme of ["light", "dark"]) {
    await page.addInitScript(
      (theme) => localStorage.setItem("quiet-chess:theme:v1", theme),
      theme,
    );
    await page.goto("/board");
    for (const fen of [
      "k7/8/8/3p4/3Q1p2/8/8/7K w - - 0 1",
      "k7/8/8/3P4/3q1P2/8/8/7K b - - 0 1",
    ]) {
      await load(page, fen);
      await square(page, "d4").click();
      await expect(square(page, "d5")).toHaveAccessibleName(
        /legal destination, capture/,
      );
      await expect(square(page, "f4")).toHaveAccessibleName(
        /legal destination, capture/,
      );
      await page.keyboard.press("ArrowUp");
      const ratios = await board(page).evaluate((el) => {
        const rgb = (value: string) =>
          value
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number);
        const luminance = (c: number[]) =>
          c
            .map((v) => v / 255)
            .map((v) =>
              v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
            )
            .reduce((v, c, i) => v + c * [0.2126, 0.7152, 0.0722][i]!, 0);
        const ratio = (a: string, b: string) => {
          const [hi, lo] = [luminance(rgb(a)), luminance(rgb(b))].sort(
            (a, b) => b - a,
          );
          return (hi! + 0.05) / (lo! + 0.05);
        };
        return [...el.querySelectorAll(".legal-destination")].map((square) => {
          const mark = getComputedStyle(square, "::after");
          const backing = getComputedStyle(
            square.closest("[data-square]")!,
          ).backgroundColor;
          return {
            opacity: mark.opacity,
            capture: square.classList.contains("capture-destination"),
            contrast: ratio(
              square.classList.contains("capture-destination")
                ? mark.borderTopColor
                : mark.backgroundColor,
              backing,
            ),
            focusContrast: ratio(
              getComputedStyle(document.activeElement!).outlineColor,
              backing,
            ),
            captureBackingContrast: square.classList.contains(
              "capture-destination",
            )
              ? ratio(
                  mark.borderTopColor,
                  mark.boxShadow.match(/rgba?\([^)]+\)/)![0],
                )
              : null,
            shadow: mark.boxShadow,
          };
        });
      });
      expect(ratios.length).toBeGreaterThan(3);
      for (const marker of ratios) {
        expect(marker.opacity).toBe("1");
        expect(marker.contrast).toBeGreaterThanOrEqual(3);
        expect(marker.focusContrast).toBeGreaterThanOrEqual(3);
        if (marker.capture) {
          expect(marker.shadow).not.toBe("none");
          expect(marker.captureBackingContrast).toBeGreaterThanOrEqual(3);
        }
      }
      await square(page, "d4").focus();
      const focus = await square(page, "d4").evaluate((el) => ({
        style: getComputedStyle(el).outlineStyle,
        width: getComputedStyle(el).outlineWidth,
      }));
      expect(focus.style).not.toBe("none");
      expect(parseFloat(focus.width)).toBeGreaterThanOrEqual(3);
    }
    await load(page, "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1");
    await expect(square(page, "e1")).toHaveAccessibleName(/in check/);
    await expect(square(page, "e1").locator(".check-marker")).toHaveText("!");
    await load(page, "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1");
    await square(page, "e5").click();
    await expect(square(page, "d6")).toHaveAccessibleName(
      /empty, legal destination, capture/,
    );
  }
});

test("pointer drag keeps legal movement and no hidden draggable control returns", async ({
  page,
}, info) => {
  test.skip(
    info.project.name === "mobile",
    "Real touch taps are covered separately; this scenario needs a mouse.",
  );
  await page.goto("/board");
  let from = (await square(page, "e2").boundingBox())!;
  let to = (await square(page, "e4").boundingBox())!;
  await square(page, "e2").focus();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 12,
  });
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(page.getByLabel("Move history", { exact: true })).toHaveText(
    "No moves yet.",
  );
  await expect(square(page, "e2")).toBeFocused();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 12,
  });
  await page
    .getByLabel("Load a position (FEN)")
    .fill("7k/P7/8/8/8/8/8/7K w - - 0 1");
  await page
    .getByRole("button", { name: "Load position", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await page.mouse.up();
  await expect(square(page, "a7")).toHaveAccessibleName(/white pawn/);
  await expect(page.getByLabel("Move history", { exact: true })).toHaveText(
    "No moves yet.",
  );
  await page
    .getByRole("button", { name: "Return to starting position", exact: true })
    .click();
  await square(page, "e2").scrollIntoViewIfNeeded();
  from = (await square(page, "e2").boundingBox())!;
  to = (await square(page, "e4").boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
  await expect(square(page, "e4")).toHaveAccessibleName(/white pawn/);
  await expect(square(page, "e4")).toBeFocused();
  await expect(
    board(page).locator(
      '.piece-visual [tabindex], .piece-visual [role="button"]',
    ),
  ).toHaveCount(0);
});

test("instructional marks and arrow have equivalent descriptions without unlocking the example", async ({
  page,
}) => {
  await page.goto("/");
  await expect(board(page)).toHaveAccessibleDescription(
    /Instructional arrow from d8 to d4/,
  );
  await expect(square(page, "d4")).toHaveAccessibleName(
    /instructional highlight/,
  );
  await expect(square(page, "d4")).toBeDisabled();
  await expect(square(page, "d4").locator(".piece-visual")).toHaveCSS(
    "outline-style",
    "dashed",
  );
  await expect(board(page).locator("svg path[marker-end]")).toHaveCSS(
    "opacity",
    "1",
  );
});

test("phone taps, promotion targets and board fit at 320px", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "mobile",
    "Uses a touch-enabled browser context.",
  );
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/board");
  await square(page, "e2").tap();
  await square(page, "e4").tap();
  await expect(square(page, "e4")).toHaveAccessibleName(/white pawn/);
  await load(page, "7k/P7/8/8/8/8/8/7K w - - 0 1");
  await square(page, "a7").tap();
  await square(page, "a8").tap();
  const choice = page.getByRole("button", { name: "knight", exact: true });
  expect((await choice.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await choice.tap();
  await expect(square(page, "a8")).toHaveAccessibleName(/white knight/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await board(page).boundingBox())!.width).toBe(288);
});
