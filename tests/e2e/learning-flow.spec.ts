import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("navigation, temporary path selection, and topic filtering", async ({ page, isMobile }) => {
  await page.goto("/career-paths");
  await page.getByRole("button", { name: "Choose Data Analytics", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Data Analytics", exact: true })).toHaveCount(2);
  await page.getByRole("link", { name: "Explore this path" }).click();
  await expect(page.getByLabel("Filter topics by career path")).toHaveValue("data-analytics");
  await page.getByLabel("Search topics").fill("no-such-topic");
  await expect(page.getByRole("heading", { name: "No matching topics" })).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.getByRole("heading", { name: "JavaScript", exact: true })).toBeVisible();
  if (isMobile) await page.locator("summary").click();
  await page.getByRole("navigation", { name: isMobile ? "Mobile navigation" : "Main navigation" }).getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.getByLabel("Preferred career path")).toHaveValue("data-analytics");
  await page.reload();
  await expect(page.getByLabel("Preferred career path")).toHaveValue("software-engineering");
});

test("lesson navigation and correct knowledge-check feedback", async ({ page }) => {
  await page.goto("/lessons/python-variables");
  await page.getByRole("radio", { name: "B. String (str)" }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Correct. Nicely reasoned.")).toBeVisible();
  await page.getByRole("link", { name: "Next lesson" }).click();
  await expect(page.getByRole("heading", { name: "Loops and iteration", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mark lesson complete" }).click();
  await expect(page.getByText("Activity only.", { exact: false })).toBeVisible();
});

test("incorrect quiz feedback, single answer count, and reset", async ({ page }) => {
  await page.goto("/practice?topic=python");
  await expect(page.getByRole("button", { name: "Check answer" })).toBeDisabled();
  await page.getByRole("radio", { name: "A. Integer (int)" }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Not quite. Here is the reasoning.")).toBeVisible();
  await expect(page.getByText("Correct answer: String (str)")).toBeVisible();
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(page.getByRole("radio").first()).not.toBeChecked();
  await page.getByRole("button", { name: "Reset this visit" }).click();
  await expect(page.getByText("Question 1 of 4")).toBeVisible();
});

test("self-review and display-only coding have no execution controls", async ({ page }) => {
  await page.goto("/practice");
  await page.getByLabel("Topic", { exact: true }).selectOption("data-structures");
  await page.getByLabel("Your explanation").fill("A stack removes the newest item first.");
  await page.getByRole("button", { name: "Reveal model answer" }).click();
  await expect(page.getByText("Model answer · self-review", { exact: true })).toBeVisible();
  await page.getByLabel("Topic", { exact: true }).selectOption("python");
  await page.getByLabel("Question format").selectOption("coding");
  await page.getByRole("button", { name: "Reveal example solution" }).click();
  await expect(page.getByText("Example solution · not executed", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Run/ })).toHaveCount(0);
});

test("settings apply across client navigation and reset on refresh", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Display name").fill("Jordan");
  await page.getByLabel("Theme", { exact: true }).selectOption("dark");
  await page.getByRole("button", { name: "Apply for this visit" }).click();
  await expect(page.locator('[data-theme="dark"]')).toBeVisible();
  await page.getByRole("link", { name: "Interview Compass dashboard" }).first().click();
  await expect(page.getByRole("heading", { name: "Welcome back, Jordan." })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Welcome back, Alex." })).toBeVisible();
});

test("representative pages fit the viewport and expose no serious accessibility findings", async ({ page }) => {
  for (const route of ["/dashboard", "/career-paths", "/learn", "/lessons/sql-joins", "/practice", "/progress", "/settings"]) {
    await page.goto(route);
    await expect(page.getByRole("main")).toBeVisible();
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow, route).toBe(false);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical"), route).toEqual([]);
  }
});

test("keyboard skip link and mobile navigation work", async ({ page, isMobile }) => {
  await page.goto("/dashboard");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  if (isMobile) {
    await page.locator("summary").click();
    await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Practice", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Practice with purpose." })).toBeVisible();
    await expect(page.locator("details")).not.toHaveAttribute("open", "");
  }
});

test("unknown topics show a recovery path", async ({ page }) => {
  // A streamed Next.js not-found page can use HTTP 200 after its loading boundary has sent headers.
  await page.goto("/learn/missing-topic");
  await expect(page.getByRole("link", { name: "Explore study topics" })).toBeVisible();
});
