import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signIn } from "./auth-fixture";

async function logout(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
}
async function requestLink(page: import("@playwright/test").Page, email: string) {
  await page.goto("/forgot-password");
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Send recovery link", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("If an account can receive");
}
async function mailbox(request: import("@playwright/test").APIRequestContext, email: string) {
  const result = await request.post("http://127.0.0.1:54329/__recovery", { data: { email } });
  return (await result.json() as { token_hash: string }).token_hash;
}

test("password recovery preserves saved account data and requires a one-use recovery link", async ({ page, request, context }, testInfo) => {
  const email = await signIn(page);
  await page.goto("/career-paths");
  await page.getByRole("button", { name: "Make primary: Business Analytics", exact: true }).click();
  await expect(page.getByRole("button", { name: "Primary path: Business Analytics", exact: true })).toBeVisible();
  await page.goto("/lessons/sql-select");
  await page.getByRole("button", { name: "Start lesson", exact: true }).click();
  await page.getByRole("button", { name: "Mark lesson complete", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lesson complete", exact: true })).toBeDisabled();
  await logout(page);
  await page.getByRole("link", { name: "Forgot password?", exact: true }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await requestLink(page, email);
  const token = await mailbox(request, email);
  // Synthetic tokens stay inside the local fixture/test process.
  await page.goto(`/auth/recovery?token_hash=${encodeURIComponent(token)}&type=recovery&next=https://evil.test`);
  await expect(page).toHaveURL(/\/reset-password$/);
  await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
  const grant = (await context.cookies()).find((cookie) => cookie.name === "ic-recovery");
  expect(grant).toMatchObject({ httpOnly: true, sameSite: "Lax" });
  expect(await page.evaluate(() => document.cookie)).not.toContain("ic-recovery");
  await page.reload();
  await page.getByLabel("New password", { exact: true }).fill("New-synthetic-passphrase-456");
  await page.getByLabel("Confirm new password", { exact: true }).fill("Different-synthetic-passphrase");
  await page.getByRole("button", { name: "Update password", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Passwords must match");
  const findings = await new AxeBuilder({ page }).analyze();
  expect(findings.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  // Capture the form only; never include the recovery callback URL or filled passwords.
  await page.getByLabel("New password", { exact: true }).fill("");
  await page.getByLabel("Confirm new password", { exact: true }).fill("");
  await page.screenshot({ path: testInfo.outputPath("reset-password.png"), caret: "initial" });
  await page.getByLabel("New password", { exact: true }).fill("New-synthetic-passphrase-456");
  await page.getByLabel("Confirm new password", { exact: true }).fill("New-synthetic-passphrase-456");
  await page.getByRole("button", { name: "Update password", exact: true }).dblclick();
  await expect(page.getByRole("status")).toContainText("Your password has been updated");
  await expect(page).toHaveURL(/\/login\?status=password-updated$/);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("New-synthetic-passphrase-456");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Primary path:", { exact: false })).toContainText("Business Analytics");
  await page.goto("/lessons/sql-select");
  await expect(page.getByRole("button", { name: "Lesson complete", exact: true })).toBeDisabled();
  await page.goto("/reset-password");
  await expect(page.getByLabel("New password", { exact: true })).toHaveCount(0);
  await page.goto(`/auth/recovery?token_hash=${encodeURIComponent(token)}&type=recovery`);
  await expect(page).toHaveURL(/\/forgot-password\?status=invalid-link$/);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("already used");
});

test("recovery rejects ordinary sessions and invalid links, masks unknown accounts, and retries provider failure", async ({ page, request }) => {
  const email = await signIn(page, `recovery-update-failure-${crypto.randomUUID()}@example.test`);
  await page.goto("/reset-password");
  await expect(page.getByLabel("New password", { exact: true })).toHaveCount(0);
  await page.goto("/auth/recovery?token_hash=expired&type=recovery");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("invalid, expired, or already used");
  await requestLink(page, `missing-${crypto.randomUUID()}@example.test`);
  await requestLink(page, email);
  const token = await mailbox(request, email);
  await page.goto(`/auth/recovery?token_hash=${encodeURIComponent(token)}&type=recovery`);
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.getByLabel("New password", { exact: true }).fill("New-synthetic-passphrase-456");
  await page.getByLabel("Confirm new password", { exact: true }).fill("New-synthetic-passphrase-456");
  await page.getByRole("button", { name: "Update password", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("could not be updated");
  // React clears uncontrolled password fields after an action; re-enter for a deliberate retry.
  await page.getByLabel("New password", { exact: true }).fill("New-synthetic-passphrase-456");
  await page.getByLabel("Confirm new password", { exact: true }).fill("New-synthetic-passphrase-456");
  await page.getByRole("button", { name: "Update password", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Your password has been updated");
});
