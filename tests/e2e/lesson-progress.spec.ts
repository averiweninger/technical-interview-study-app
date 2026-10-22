import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signIn } from "./auth-fixture";

test("reading bookmarks and completion survive refresh, logout, and a second account", async ({ page }, testInfo) => {
  const email = await signIn(page);
  await page.goto("/lessons/python-variables");
  await expect(page.getByText("Not started.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark lesson complete" })).toBeDisabled();
  await page.getByRole("button", { name: "Start lesson", exact: true }).click();
  await expect(page.getByRole("link", { name: "Resume lesson" })).toHaveAttribute("href", "#section-0");
  await page.getByLabel("Reading position").selectOption("1");
  await page.getByRole("button", { name: "Save my place" }).click();
  await expect(page.getByText("Saved at section 2 of 3.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: "Resume lesson" })).toHaveAttribute("href", "#section-1");
  // Avoid screenshot caret-style mutations while streamed quiz controls are still hydrating.
  await page.screenshot({ path: testInfo.outputPath("lesson-progress.png"), fullPage: true, caret: "initial" });
  await page.getByRole("link", { name: "Resume lesson" }).click();
  await expect(page).toHaveURL(/#section-1$/);
  await page.getByRole("button", { name: "Mark lesson complete" }).click();
  await expect(page.getByRole("button", { name: "Lesson complete", exact: true })).toBeDisabled();
  await expect(page.getByText("Lesson complete. Your progress is saved.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await signIn(page);
  await page.goto("/lessons/python-variables");
  await expect(page.getByRole("button", { name: "Start lesson", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await signIn(page, email);
  await page.goto("/lessons/python-variables");
  await expect(page.getByRole("button", { name: "Lesson complete", exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByText("Lesson complete. Your progress is saved.", { exact: true })).toBeVisible();
  const findings = await new AxeBuilder({ page }).analyze();
  expect(findings.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("progress errors preserve reading and offer a retry", async ({ page }) => {
  await signIn(page, "progress-failure@example.test");
  await page.goto("/lessons/sql-select");
  await expect(page.getByRole("heading", { name: "What you will learn" })).toBeVisible();
  const error = page.getByRole("alert").filter({ hasText: "Lesson progress is unavailable" });
  await expect(error).toBeVisible();
  await page.getByRole("button", { name: "Retry loading progress" }).click();
  await expect(error).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark lesson complete" })).toBeDisabled();
});
