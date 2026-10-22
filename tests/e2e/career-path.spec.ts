import { test, expect } from "@playwright/test";
import { signIn } from "./auth-fixture";

async function logout(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
}

test("a saved path updates dashboard and default filters across reload, login, and accounts", async ({ page }, testInfo) => {
  const email = await signIn(page);
  await page.goto("/career-paths");
  await page.getByRole("button", { name: "Choose Business Analytics", exact: true }).click();
  await expect(page.getByRole("button", { name: "Selected path: Business Analytics", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Selected path: Business Analytics", exact: true })).toBeVisible();
  await page.goto("/dashboard");
  await expect(page.getByText("Selected path:", { exact: false })).toContainText("Business Analytics");
  await expect(page.getByRole("heading", { name: "Your first SELECT statement", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("business-analytics-dashboard.png"), fullPage: true, caret: "initial" });
  await page.goto("/learn");
  await expect(page.getByLabel("Filter topics by career path")).toHaveValue("business-analytics");
  await expect(page.getByRole("heading", { name: "SQL", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "JavaScript", exact: true })).toHaveCount(0);
  await page.goto("/practice");
  await expect(page.getByLabel("Topic", { exact: true })).toHaveValue("path");
  await expect(page.getByLabel("Topic", { exact: true })).toContainText("Business Analytics topics");
  await logout(page);
  await signIn(page);
  await expect(page.getByText("Selected path:", { exact: false })).toContainText("Software Engineering");
  await logout(page);
  await signIn(page, email);
  await expect(page.getByText("Selected path:", { exact: false })).toContainText("Business Analytics");
});

test("settings saves another path and a failed save retains the prior choice", async ({ page }) => {
  await signIn(page);
  await page.goto("/settings");
  await page.getByLabel("Preferred career path").selectOption("technology-consulting");
  await page.getByRole("button", { name: "Save preferences", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Career path saved" })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Preferred career path")).toHaveValue("technology-consulting");
  await page.goto("/career-paths");
  await expect(page.getByRole("button", { name: "Selected path: Technology Consulting", exact: true })).toBeVisible();
  await logout(page);
  await signIn(page, "path-save-failure@example.test");
  await page.goto("/career-paths");
  await page.getByRole("button", { name: "Choose Business Analytics", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "could not be saved" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Selected path: Software Engineering", exact: true })).toHaveAttribute("aria-pressed", "true");
});
