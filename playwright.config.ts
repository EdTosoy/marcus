import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

// Reuse workstation Chromium when present; other systems can use Playwright's browser.
const systemChromium = "/etc/profiles/per-user/edtosoy/bin/chromium";
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  (existsSync(systemChromium) ? systemChromium : undefined);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath, chromiumSandbox: true },
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
    ...(process.env.MARCUS_EXTRA_BROWSERS === "1"
      ? [
          {
            name: "firefox",
            use: { ...devices["Desktop Firefox"], launchOptions: {} },
          },
          {
            name: "webkit",
            use: { ...devices["Desktop Safari"], launchOptions: {} },
          },
        ]
      : []),
  ],
  webServer: {
    env: { NEXT_DIST_DIR: process.env.NEXT_DIST_DIR ?? ".next" },
    command: "pnpm start --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
