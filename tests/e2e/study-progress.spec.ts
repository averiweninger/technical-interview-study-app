import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signIn } from "./auth-fixture";

async function logout(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
}
function metric(page: import("@playwright/test").Page, label: string) {
  return page.locator(".dashboard-stats > div, .metric-item").filter({ has: page.getByText(label, { exact: true }) }).locator(".metric-value");
}

test("saved lessons and grades drive consistent private dashboards across refresh and accounts", async ({ page }, testInfo) => {
  const email = await signIn(page);
  await expect(metric(page, "Lessons completed")).toHaveText("0 / 6");
  await expect(metric(page, "Graded submissions")).toHaveText("0");
  await expect(page.getByText("No saved activity yet.", { exact: false })).toBeVisible();
  await page.goto("/lessons/python-variables");
  await page.getByRole("button", { name: "Start lesson", exact: true }).click();
  await page.getByRole("button", { name: "Mark lesson complete" }).click();
  await expect(page.getByRole("button", { name: "Lesson complete", exact: true })).toBeDisabled();
  await page.goto("/practice?topic=python");
  // Neither the initial HTML/RSC payload nor browser props contain the private explanation.
  expect(await page.content()).not.toContain('Quotation marks make');
  await page.getByRole("radio", { name: "B. String (str)" }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).dblclick();
  await expect(page.getByText("Correct. Nicely reasoned.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("radio", { name: "B. String (str)" })).toBeChecked();
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await page.goto("/dashboard");
  await expect(metric(page, "Lessons completed")).toHaveText("1 / 6");
  await expect(metric(page, "Graded submissions")).toHaveText("1");
  await expect(metric(page, "Practice score")).toHaveText("100%");
  // Await the streamed route, not a still-visible previous screen, before visual/a11y review.
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page).toHaveTitle(/Dashboard/);
  await expect(page.getByText("Loading workspace", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("persistent-dashboard.png"), fullPage: true, caret: "initial" });
  const findings = await new AxeBuilder({ page }).analyze();
  expect(findings.violations.filter((entry) => entry.impact === "serious" || entry.impact === "critical")).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await page.goto("/progress");
  await expect(metric(page, "Lessons completed")).toHaveText("1 / 6");
  await expect(metric(page, "Graded submissions")).toHaveText("1");
  await expect(metric(page, "Practice score")).toHaveText("100%");
  await expect(page.getByRole("cell", { name: "Not assessed", exact: true }).first()).toBeVisible();
  await logout(page);
  await signIn(page);
  await expect(metric(page, "Lessons completed")).toHaveText("0 / 6");
  await expect(metric(page, "Graded submissions")).toHaveText("0");
  await logout(page);
  await signIn(page, email);
  await expect(metric(page, "Lessons completed")).toHaveText("1 / 6");
  await expect(metric(page, "Graded submissions")).toHaveText("1");
});

test("anonymous/direct API writes remain blocked and summary failures never show fake statistics", async ({ page, request }) => {
  const anonymous = await request.get("http://127.0.0.1:54329/rest/v1/lesson_progress", { headers: { apikey: "sb_publishable_synthetic_e2e_only" } });
  expect(anonymous.status()).toBe(401);
  const email = await signIn(page);
  const tokenResponse = await request.post("http://127.0.0.1:54329/auth/v1/token?grant_type=password", { data: { email, password: "Synthetic-passphrase-123" } });
  const session = await tokenResponse.json() as { access_token: string };
  const write = await request.post("http://127.0.0.1:54329/rest/v1/question_attempts", { headers: { apikey: "sb_publishable_synthetic_e2e_only", authorization: `Bearer ${session.access_token}` }, data: { score: 1 } });
  expect(write.status()).toBe(403);
  await logout(page);
  await signIn(page, "progress-failure@example.test");
  await expect(page.getByRole("alert").filter({ hasText: "Study progress is unavailable" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Your study statistics" })).toHaveCount(0);
});
