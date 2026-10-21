import { test as base, expect } from "@playwright/test";

export async function signIn(page: import("@playwright/test").Page, email = `learner-${crypto.randomUUID()}@example.test`) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Synthetic-passphrase-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Welcome back, Learner." })).toBeVisible({ timeout: 30_000 });
  return email;
}

export const test = base.extend({ page: async ({ page }, runTest) => { await signIn(page); await runTest(page); } });
export { expect };
