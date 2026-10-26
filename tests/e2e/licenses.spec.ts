import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const provenance = JSON.parse(
  readFileSync(
    new URL(
      "../../third_party/stockfish/19.0.1/provenance.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

test("source and licenses are discoverable, exact and do not start the engine", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  const engineLoads: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (req) => {
    if (/\/engine\/.*\.(js|wasm)(\?|$)/.test(req.url()))
      engineLoads.push(req.url());
  });
  await page.goto("/");
  const footer = page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Open source licenses" });
  await footer.focus();
  await expect(footer).toBeFocused();
  await footer.press("Enter");
  await expect(page).toHaveURL(/\/open-source$/);
  await expect(
    page.getByRole("heading", { name: "Stockfish.js 19.0.1" }),
  ).toBeVisible();
  for (const anchor of await page.locator("main a").all()) {
    const path = await anchor.getAttribute("href");
    expect(path).toMatch(/^\/(engine|licenses)\//);
    const response = await request.get(path!);
    expect(response.status(), path!).toBe(200);
    if (path === provenance.sourceArchive.publicPath) {
      expect(response.headers()["content-type"]).toMatch(
        /application\/(gzip|x-gzip)/,
      );
      expect(
        createHash("sha256")
          .update(await response.body())
          .digest("hex"),
      ).toBe(provenance.sourceArchive.sha256);
    }
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(engineLoads).toEqual([]);
  expect(errors).toEqual([]);
});
