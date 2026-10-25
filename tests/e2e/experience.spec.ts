import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { baseline, START } from "../../src/domain/adaptive/test-fixtures";
import { foundationExercises as bank } from "../../src/domain/curriculum/foundations";
import { learningTransition } from "../../src/domain/adaptive/session";

test("approved icon bytes, manifest, and accessible viewport metadata are served", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator('meta[name="application-name"]')).toHaveAttribute(
    "content",
    "Quiet Chess",
  );
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    "content",
    /viewport-fit=cover/,
  );
  expect(
    await page.locator('meta[name="viewport"]').getAttribute("content"),
  ).not.toContain("user-scalable=no");
  const manifestUrl = await page
    .locator('link[rel="manifest"]')
    .getAttribute("href");
  const response = await request.get(manifestUrl!);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.name).toBe("Quiet Chess");
  expect(manifest.icons).toHaveLength(2);
  expect(
    manifest.icons.every((icon: { purpose: string }) => icon.purpose === "any"),
  ).toBe(true);
  for (const [url, file] of [
    ["/favicon.ico", "favicon.ico"],
    ["/favicon-16x16.png", "favicon-16x16.png"],
    ["/favicon-32x32.png", "favicon-32x32.png"],
    ["/favicon-48x48.png", "favicon-48x48.png"],
    ["/apple-touch-icon.png", "apple-touch-icon.png"],
    ["/brand/icon-192.png", "icon-192.png"],
    ["/brand/icon-512.png", "icon-512.png"],
  ]) {
    const asset = await request.get(url!);
    expect(asset.ok()).toBe(true);
    expect(
      Buffer.compare(await asset.body(), await readFile(`assets/${file}`)),
    ).toBe(0);
  }
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "sizes",
    "180x180",
  );
  await expect(
    page.getByRole("link", { name: "Quiet Chess home" }),
  ).toBeVisible();
});

test("theme follows the system, overrides persist, and mobile navigation manages focus", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 320, height: 850 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Color theme: system. Switch to light." }),
  ).toBeVisible();
  const background = () =>
    page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await background()).toBe("rgb(16, 29, 23)");
  await page
    .getByRole("button", { name: "Color theme: system. Switch to light." })
    .click();
  expect(await background()).toBe("rgb(247, 248, 243)");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Color theme: light. Switch to dark." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Color theme: light. Switch to dark." })
    .click();
  expect(await background()).toBe("rgb(16, 29, 23)");
  const menu = page.getByRole("button", { name: /^Menu/ });
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("navigation")).toBeHidden();
  await menu.focus();
  await page.keyboard.press("Enter");
  await page.getByRole("link", { name: "Pilot guide", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await page.getByRole("link", { name: "Pilot guide", exact: true }).click();
  await expect(page.locator("main")).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  await expect(
    page.getByRole("link", { name: "Pilot guide", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const controls = await page
    .locator(".header-actions button, nav a")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
    );
  expect(controls.every((rect) => rect.width >= 44 && rect.height >= 44)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});

test("pilot guidance shows stages and counts without exposing baseline answers", async ({
  page,
}) => {
  await page.clock.setFixedTime(START + 1000);
  const data = baseline(false);
  data.runs = data.runs.slice(0, 1);
  await page.addInitScript(
    (data) => localStorage.setItem("marcus:learning:v2", JSON.stringify(data)),
    data,
  );
  await page.goto("/pilot");
  await expect(
    page
      .getByRole("list", { name: "Supervised pilot stages" })
      .getByRole("listitem"),
  ).toHaveCount(7);
  await expect(
    page.getByText("1 of 5 baseline decisions recorded", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Educator-approved held-out content is a pilot prerequisite",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.locator(".evaluation-metrics")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Reveal|Export/ })).toHaveCount(
    0,
  );
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("marcus:learning:v2")!).runs.length,
    ),
  ).toBe(1);
});

test("local outcomes remain sealed during partial baseline and active independent checks", async ({
  page,
}) => {
  await page.clock.setFixedTime(START + 1000);
  const partial = baseline();
  partial.runs = partial.runs.slice(0, 1);
  await page.addInitScript(
    (data) => localStorage.setItem("marcus:learning:v2", JSON.stringify(data)),
    partial,
  );
  await page.goto("/evaluation");
  await expect(
    page.getByRole("heading", {
      name: "Finish the check before viewing outcomes.",
    }),
  ).toBeVisible();
  await expect(page.locator(".evaluation-metrics")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Export local evaluation (JSON)" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Start training timer" }),
  ).toBeVisible();
  let active = baseline();
  let exercise = bank[0]!;
  // Follow real prerequisites until an independent check is actually eligible.
  for (let index = 0; index < bank.length; index++) {
    const at = START + 500 + index * 50;
    active = learningTransition(active, { type: "start" }, bank, at);
    const run = active.runs.find((run) => run.id === active.activeRunId)!;
    exercise = bank.find((exercise) => exercise.id === run.exerciseId)!;
    if (exercise.role === "transfer") break;
    active = learningTransition(
      active,
      { type: "submit", response: exercise.review.validExamples[0]! },
      bank,
      at + 1,
    );
    active = learningTransition(active, { type: "next" }, bank, at + 2);
  }
  expect(exercise.role).toBe("transfer");
  await page.evaluate(
    (data) => localStorage.setItem("marcus:learning:v2", JSON.stringify(data)),
    active,
  );
  // This new page has no fixture initializer that could replace the active check.
  const independent = await page.context().newPage();
  await independent.clock.setFixedTime(START + 10000);
  await independent.goto("/evaluation");
  await expect(
    independent.getByText("Finish and leave your independent check first.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(independent.locator(".evaluation-metrics")).toHaveCount(0);
  const answered = learningTransition(
    active,
    { type: "submit", response: exercise.review.validExamples[0]! },
    bank,
    START + 5000,
  );
  await independent.evaluate(
    (data) => localStorage.setItem("marcus:learning:v2", JSON.stringify(data)),
    answered,
  );
  await independent.reload();
  await expect(independent.locator(".evaluation-metrics")).toHaveCount(0);
  const left = learningTransition(
    answered,
    { type: "next" },
    bank,
    START + 6000,
  );
  await independent.evaluate(
    (data) => localStorage.setItem("marcus:learning:v2", JSON.stringify(data)),
    left,
  );
  await independent.reload();
  await expect(
    independent.getByRole("button", { name: "Export local evaluation (JSON)" }),
  ).toBeVisible();
  expect(
    await independent.evaluate(
      () => JSON.parse(localStorage.getItem("marcus:learning:v2")!).runs.length,
    ),
  ).toBe(left.runs.length);
  await independent.close();
});

test("core routes fit 320px through desktop in light and dark without loading an engine", async ({
  page,
}, info) => {
  const engineRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/engine/"))
      engineRequests.push(request.url());
  });
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      for (const path of [
        "/",
        "/learn",
        "/play",
        "/review",
        "/evaluation",
        "/pilot",
        "/board",
      ]) {
        await page.goto(path);
        await expect(page.locator("main")).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${path} at ${width} ${colorScheme}`,
        ).toBe(true);
      }
    }
  }
  expect(engineRequests).toEqual([]);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/pilot");
  await page.screenshot({
    path: info.outputPath("pilot-320-dark.png"),
    fullPage: true,
  });
});

test("theme text contrast remains readable on primary surfaces", async ({
  page,
}) => {
  function luminance(rgb: number[]) {
    return rgb
      .map((x) => x / 255)
      .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
      .reduce((sum, x, i) => sum + x * [0.2126, 0.7152, 0.0722][i]!, 0);
  }
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    await page.goto("/pilot");
    const pairs = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return [
        ["--color-ink", "--color-paper"],
        ["--color-muted", "--color-paper"],
        ["--color-muted", "--color-paper-2"],
        ["--color-accent-ink", "--color-accent"],
      ].map(([front, back]) =>
        [front!, back!].map((name) => {
          const color = document.createElement("span");
          color.style.color = style.getPropertyValue(name);
          document.body.append(color);
          const rgb = getComputedStyle(color)
            .color.match(/[\d.]+/g)!
            .map(Number);
          color.remove();
          return rgb.slice(0, 3);
        }),
      );
    });
    for (const [front, back] of pairs) {
      const a = luminance(front!),
        b = luminance(back!);
      expect(
        (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      ).toBeGreaterThanOrEqual(4.5);
    }
  }
});
