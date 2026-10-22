import { expect, test } from "./auth-fixture";
import AxeBuilder from "@axe-core/playwright";

test("compact navigation and account disclosure support keyboard, dismissal, and settings", async ({ page, isMobile }, testInfo) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Continue learning", exact: true })).toBeVisible();
  expect((await page.getByRole("banner").boundingBox())!.height).toBeLessThanOrEqual(72);
  await expect(page.getByText("Demo workspace.")).toHaveCount(0);
  await expect(page.getByRole("main").getByText("Learner", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("navigation", { includeHidden: true }).getByRole("link", { name: "Settings", exact: true, includeHidden: true })).toHaveCount(0);
  const stats = page.getByRole("region", { name: "Your study statistics" }).locator(":scope > div");
  const heights = await stats.evaluateAll((cards) => cards.map((card) => card.getBoundingClientRect().height));
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);

  const account = page.getByRole("button", { name: "Account menu", exact: true });
  await expect(account).toHaveText("L");
  await account.focus();
  await page.keyboard.press("Enter");
  const options = page.locator("#account-options");
  await expect(options.getByText("Learner", { exact: true })).toBeVisible();
  await expect(options.getByText(/@example\.test$/)).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(options.getByRole("link", { name: "Settings", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(options.getByRole("button", { name: "Log out", exact: true })).toBeFocused();
  const findings = await new AxeBuilder({ page }).analyze();
  expect(findings.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("profile-menu.png") });
  await page.keyboard.press("Escape");
  await expect(account).toBeFocused();
  await expect(options).not.toBeVisible();
  await account.click();
  await page.getByRole("main").click({ position: { x: 1, y: 1 } });
  await expect(options).not.toBeVisible();
  await account.click();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(options).not.toBeVisible();

  if (isMobile) {
    const navigation = page.getByRole("button", { name: "Navigation", exact: true });
    await navigation.focus();
    await page.keyboard.press("Space");
    const mobileLinks = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(mobileLinks).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(navigation).toBeFocused();
    await expect(mobileLinks).not.toBeVisible();
    await navigation.click();
    await page.getByRole("main").click({ position: { x: 1, y: 1 } });
    await expect(mobileLinks).not.toBeVisible();
    await navigation.click();
    await mobileLinks.getByRole("link", { name: "Practice", exact: true }).click();
    await expect(mobileLinks).not.toBeVisible();
  } else {
    await expect(page.getByRole("button", { name: "Navigation", exact: true })).not.toBeVisible();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Practice", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Practice questions", exact: true })).toBeVisible();
  await expect(page.locator('a.nav-link[href="/practice"]').first()).toHaveAttribute("aria-current", "page");
  await account.click();
  await options.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(options).not.toBeVisible();
});

test("dashboard stays compact and readable with increased text size", async ({ page }, testInfo) => {
  await page.goto("/dashboard");
  await page.addStyleTag({ content: "html { font-size: 20px; }" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  await expect(page.getByRole("link", { name: "Continue learning", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("dashboard-large-text.png"), fullPage: true });
});
