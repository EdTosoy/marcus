import { expect, test, type Page } from "@playwright/test";

async function square(page: Page, name: string) {
  const target = page.getByRole("button", { name: new RegExp(`^${name} `) });
  if (test.info().project.name === "mobile") await target.tap();
  else await target.click();
}
async function move(page: Page, from: string, to: string) {
  await square(page, from);
  await square(page, to);
}
async function load(page: Page, fen: string) {
  await page.getByLabel("Load a position (FEN)").fill(fen);
  await page
    .getByRole("button", { name: "Load position", exact: true })
    .click();
}

test("legal movement, SAN, undo, restart, invalid FEN, and orientation", async ({
  page,
}) => {
  await page.goto("/board");
  await square(page, "e2");
  await expect(
    page.getByRole("button", { name: /^e4 .*legal destination/ }),
  ).toBeVisible();
  await square(page, "e5");
  await expect(page.getByLabel("Move history", { exact: true })).toHaveText(
    "No moves yet.",
  );
  await square(page, "e4");
  await move(page, "e7", "e5");
  await expect(page.getByLabel("Move history", { exact: true })).toHaveText(
    "1. e4 e5 ",
  );
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /^e7 black pawn/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Restart position" }).click();
  await expect(
    page.getByRole("button", { name: /^e2 white pawn/ }),
  ).toBeVisible();
  const before = await page
    .getByRole("button", { name: /^a1 white rook/ })
    .boundingBox();
  await page.getByRole("button", { name: "Flip board" }).click();
  const after = await page
    .getByRole("button", { name: /^a1 white rook/ })
    .boundingBox();
  expect(after!.x).toBeGreaterThan(before!.x);
  await load(page, "invalid");
  await expect(
    page.getByRole("alert").filter({ hasText: "That FEN is invalid" }),
  ).toBeVisible();
});

test("castling, en passant, promotion choice, check, and terminal position", async ({
  page,
}) => {
  await page.goto("/board");
  await load(page, "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
  await move(page, "e1", "g1");
  await expect(
    page.getByRole("button", { name: /^f1 white rook/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Move history", { exact: true })).toContainText(
    "O-O",
  );
  await load(page, "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1");
  await move(page, "e5", "d6");
  await expect(page.getByRole("button", { name: /^d5 empty/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^d6 white pawn/ }),
  ).toBeVisible();
  await load(page, "7k/P7/8/8/8/8/8/7K w - - 0 1");
  await move(page, "a7", "a8");
  await expect(
    page.getByRole("group", { name: "Promote your pawn to…" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "rook", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /^a8 white rook/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Black to move, in check." }),
  ).toBeVisible();
  await load(
    page,
    "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3",
  );
  await expect(
    page.getByRole("status").filter({ hasText: "Checkmate. Black wins." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^e1 white king/ }),
  ).toBeDisabled();
  await expect(page.getByLabel("Move history", { exact: true })).toHaveText(
    "No moves yet.",
  );
});
