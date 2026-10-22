import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signIn } from "./auth-fixture";

test("email settings use a compact row and a keyboard-accessible dialog", async ({ page }, testInfo) => {
  const email = await signIn(page);
  await page.goto("/settings");
  const change = page.getByRole("button", { name: "Change email", exact: true });
  const dialog = page.getByRole("dialog", { name: "Change email", exact: true });
  await expect(page.locator("#account-current-email")).toHaveText(email);
  await expect(dialog).not.toBeVisible();
  await expect(page.getByLabel("New email address")).not.toBeVisible();
  await change.focus();
  await page.keyboard.press("Enter");
  const input = dialog.getByLabel("New email address");
  await expect(input).toBeFocused();
  await expect(dialog.getByLabel("Current email", { exact: true })).toHaveValue(email);
  await expect(dialog.getByLabel("Current email", { exact: true })).toHaveAttribute("readonly", "");
  await input.fill("draft@example.test");
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Confirm Change", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByLabel("Current email", { exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Confirm Change", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(change).toBeFocused();

  for (const theme of ["light", "dark"]) {
    if (theme === "dark") await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await change.click();
    await expect(input).toHaveValue("");
    const findings = await new AxeBuilder({ page }).analyze();
    expect(findings.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
    const box = (await dialog.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    await page.screenshot({ path: testInfo.outputPath(`email-dialog-${theme}.png`) });
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(change).toBeFocused();
  }
});

test("email dialog prevents pending submissions and preserves results after dismissal", async ({ page }) => {
  const email = await signIn(page);
  await page.goto("/settings");
  const change = page.getByRole("button", { name: "Change email", exact: true });
  const dialog = page.getByRole("dialog", { name: "Change email", exact: true });
  await change.click();
  await dialog.getByLabel("New email address").fill("failure@example.test");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let submissions = 0;
  await page.route("**/settings", async (route) => {
    if (route.request().method() === "POST" && route.request().headers()["next-action"]) {
      submissions += 1;
      await gate;
    }
    await route.continue();
  });
  try {
    await dialog.getByRole("button", { name: "Confirm Change", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Processing…", exact: true })).toBeDisabled();
    await expect(dialog.getByLabel("New email address")).toBeDisabled();
    await dialog.locator("form").evaluate((form: HTMLFormElement) => form.requestSubmit());
    await expect.poll(() => submissions).toBe(1);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(change).toBeFocused();
    await expect(page.getByText("Requesting email change…", { exact: true })).toBeVisible();
    release();
    const row = page.getByRole("region", { name: "Email address", exact: true });
    await expect(row.getByRole("alert")).toContainText("could not be requested");
    await change.click();
    await expect(dialog.getByRole("alert")).toHaveCount(0);
    await dialog.getByLabel("New email address").fill(`modal-${crypto.randomUUID()}@example.test`);
    await dialog.getByRole("button", { name: "Confirm Change", exact: true }).click();
    await expect(dialog.getByRole("status")).toContainText("Email change requested.");
    await expect(dialog.getByLabel("Current email", { exact: true })).toHaveValue(email);
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(row.getByRole("status").filter({ hasText: "Email change requested." })).toBeVisible();
    await expect(page.locator("#account-current-email")).toHaveText(email);
  } finally {
    release();
    await page.unroute("**/settings");
  }
});
