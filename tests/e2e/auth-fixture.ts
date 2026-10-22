import { test as base, expect, type BrowserContext } from "@playwright/test";

export async function signIn(page: import("@playwright/test").Page, email = `learner-${crypto.randomUUID()}@example.test`) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Synthetic-passphrase-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible({ timeout: 30_000 });
  return email;
}

export async function expectProfile(page: import("@playwright/test").Page, fullName: string) {
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await expect(page.locator("#account-options").getByText(fullName, { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
}

export async function expectInitials(page: import("@playwright/test").Page, initials: string) {
  const decoration = page.getByRole("button", { name: "Account menu", exact: true }).locator("[data-initials]");
  await expect.poll(() => decoration.evaluate((node) => getComputedStyle(node, "::before").content)).toBe(JSON.stringify(initials));
}

type WorkspaceFixtures = { workspaceSession: Awaited<ReturnType<BrowserContext["storageState"]>> };

// Read-only workspace checks reuse one verified synthetic login per worker, avoiding the real
// sign-in abuse limit. Every test still gets a fresh context; auth mutations use separate accounts.
export const test = base.extend<object, WorkspaceFixtures>({
  workspaceSession: [async ({ browser }, runTests, workerInfo) => {
    const context = await browser.newContext({ baseURL: workerInfo.project.use.baseURL, storageState: { cookies: [], origins: [] } });
    try {
      await signIn(await context.newPage());
      await runTests(await context.storageState());
    } finally { await context.close(); }
  }, { scope: "worker" }],
  storageState: async ({ workspaceSession }, runTest) => { await runTest(workspaceSession); },
});
export { expect };
