import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  // An installed Chrome/Edge channel can be used without downloading another browser.
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure", channel: process.env.PLAYWRIGHT_CHANNEL },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
  ],
  webServer: [{
    command: "node tests/fixtures/supabase-auth-server.ts",
    url: "http://127.0.0.1:54329/health",
    reuseExistingServer: false,
  }, {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/login",
    // A dedicated local auth fixture keeps tests away from .env.local and hosted user accounts.
    env: {
      APP_URL: "http://127.0.0.1:3100",
      NEXT_DIST_DIR: ".next/e2e",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic_e2e_only",
    },
    reuseExistingServer: false,
    timeout: 120_000,
  }],
});
