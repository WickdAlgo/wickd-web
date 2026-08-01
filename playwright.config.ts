import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    // Pinned so bitmap sizes are comparable with CSS pixels. The chart
    // assertions read canvas.width, which is CSS width times DPR.
    deviceScaleFactor: 1,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // `pnpm build` runs the Next build as part of the OpenNext bundle, so
    // `.next/` is already populated in CI and `start` needs no rebuild.
    command: "pnpm start",
    url: "http://localhost:3000/platform/inspect",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
