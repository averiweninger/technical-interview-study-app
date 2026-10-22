import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signIn, expectProfile, expectInitials } from "./auth-fixture";

test("anonymous deep links require login and resume at the requested page", async ({ page }) => {
  for (const path of ["/dashboard", "/career-paths", "/learn/python", "/lessons/sql-joins", "/progress", "/settings"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
    await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
  }
  await page.goto("/practice?topic=sql");
  await page.getByLabel("Email address").fill(`deep-link-${crypto.randomUUID()}@example.test`);
  await page.getByLabel("Password", { exact: true }).fill("Synthetic-passphrase-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/practice\?topic=sql$/);
  await expect(page.getByRole("heading", { name: "Practice questions" })).toBeVisible();
});

test("auth forms provide accessible validation and generic credential errors", async ({ page }, testInfo) => {
  await page.goto("/login?next=https://evil.test&status=__proto__");
  await page.getByLabel("Email address").fill("incorrect@example.test");
  await page.getByLabel("Password", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Email or password is incorrect");
  for (const route of ["/login", "/signup"]) {
    await page.goto(route);
    const findings = await new AxeBuilder({ page }).analyze();
    expect(findings.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    if (route === "/login") await page.screenshot({ path: testInfo.outputPath("login.png") });
  }
  await page.getByLabel("Email address").fill("new@example.test");
  await page.getByLabel("First name", { exact: true }).fill("Taylor");
  await page.getByLabel("Last name", { exact: true }).fill("Morgan");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  expect(await page.getByLabel("Password", { exact: true }).evaluate((input: HTMLInputElement) => input.validity.tooShort)).toBe(true);
});

test("signup, token-hash confirmation, and logout preserve secure session boundaries", async ({ page, context }) => {
  await page.goto("/signup");
  await page.getByLabel("Email address").fill(`signup-${crypto.randomUUID()}@example.test`);
  await page.getByLabel("First name", { exact: true }).fill("Taylor");
  await page.getByLabel("Last name", { exact: true }).fill("Morgan");
  await page.getByLabel("Password", { exact: true }).fill("Synthetic-passphrase-123");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await page.goto("/auth/callback?token_hash=expired&type=email");
  await expect(page.getByRole("status")).toContainText("invalid or has expired");
  await page.goto("/auth/callback?token_hash=valid-email-token&type=email&next=//evil.test");
  await expect(page).toHaveURL(/\/dashboard\?confirmation=signup$/);
  const session = (await context.cookies()).find((cookie) => cookie.name.endsWith("auth-token"));
  expect(session).toMatchObject({ httpOnly: true, sameSite: "Lax" });
  expect(await page.evaluate(() => document.cookie)).not.toContain("auth-token");
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("signed out");
  expect((await context.cookies()).filter((cookie) => cookie.name.endsWith("auth-token"))).toHaveLength(0);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("same-browser PKCE confirmation uses the stored verifier", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email address").fill(`pkce-${crypto.randomUUID()}@example.test`);
  await page.getByLabel("First name", { exact: true }).fill("Taylor");
  await page.getByLabel("Last name", { exact: true }).fill("Morgan");
  await page.getByLabel("Password", { exact: true }).fill("Synthetic-passphrase-123");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await page.goto("/auth/callback?code=valid-pkce-code&next=/learn");
  await expect(page).toHaveURL(/\/learn\?confirmation=signup$/);
  await expect(page.getByRole("heading", { name: "Study topics", exact: true })).toBeVisible();
});

test("expired sessions refresh and forged identity fields never authorize another user", async ({ page, context }) => {
  const email = await signIn(page);
  const cookie = (await context.cookies()).find((value) => value.name.endsWith("auth-token"));
  expect(cookie).toBeDefined();
  const session = JSON.parse(Buffer.from(cookie!.value.slice("base64-".length), "base64url").toString("utf8"));
  const oldRefresh = session.refresh_token;
  session.expires_at = Math.floor(Date.now() / 1000) - 60;
  session.user.email = "victim@example.test";
  await context.addCookies([{ ...cookie!, value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}` }]);
  const response = await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await expect(page.getByTitle(email, { exact: true })).toHaveCount(1);
  await expect(page.getByTitle("victim@example.test", { exact: true })).toHaveCount(0);
  const refreshed = (await context.cookies()).find((value) => value.name === cookie!.name)!;
  expect(JSON.parse(Buffer.from(refreshed.value.slice("base64-".length), "base64url").toString("utf8")).refresh_token).not.toBe(oldRefresh);
  expect(response?.headers()["cache-control"]).toContain("no-store");
  session.access_token = "forged.invalid.token";
  session.expires_at = Math.floor(Date.now() / 1000) + 3600;
  await context.addCookies([{ ...cookie!, value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}` }]);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("two verified browser sessions retain their own identity", async ({ page, browser }) => {
  const firstEmail = await signIn(page);
  const secondContext = await browser.newContext();
  try {
    const secondPage = await secondContext.newPage();
    const secondEmail = await signIn(secondPage);
    await page.reload();
    await expect(page.getByTitle(firstEmail, { exact: true })).toHaveCount(1);
    await expect(page.getByTitle(secondEmail, { exact: true })).toHaveCount(0);
    await secondPage.reload();
    await expect(secondPage.getByTitle(secondEmail, { exact: true })).toHaveCount(1);
    await expect(secondPage.getByTitle(firstEmail, { exact: true })).toHaveCount(0);
  } finally {
    await secondContext.close();
  }
});

test("signup saves names, blocks duplicate submits, and respects provider enumeration protections", async ({ page }) => {
  test.setTimeout(120_000);
  const email = `named-${crypto.randomUUID()}@example.test`;
  let submissions = 0;
  await page.route("**/signup", async (route) => {
    if (route.request().method() === "POST") {
      submissions++;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    await route.continue();
  });
  async function fillSignup(address: string) {
    await page.goto("/signup");
    await page.getByLabel("First name", { exact: true }).fill("Taylor");
    await page.getByLabel("Last name", { exact: true }).fill("Morgan");
    await page.getByLabel("Email address").fill(address);
    await page.getByLabel("Password", { exact: true }).fill("Synthetic-passphrase-123");
  }
  await fillSignup(email);
  await page.locator("form").evaluate((form: HTMLFormElement) => { form.requestSubmit(); form.requestSubmit(); });
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  expect(submissions).toBe(1);
  await page.goto(`/auth/callback?token_hash=${encodeURIComponent(`signup:${email}`)}&type=email`);
  await expectProfile(page, "Taylor Morgan");
  await expectInitials(page, "TM");
  await expect(page.getByText("Your email has been confirmed.", { exact: false })).toBeVisible();
  await fillSignup("disclosed@example.test");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("An account with this email already exists. Please log in instead.");
  await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  await fillSignup("neutral@example.test");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("If this address can be registered");
});

test("account settings persist names, confirm email changes, and expose no deletion operation", async ({ page, context, browser }, testInfo) => {
  test.setTimeout(120_000);
  const email = await signIn(page);
  await page.goto("/settings");
  await expect(page.locator("#account-current-email")).toHaveText(email);
  await page.getByLabel("First name", { exact: true }).fill("Jordan");
  await page.getByLabel("Last name", { exact: true }).fill("Rivera");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(page.getByText("Your name has been updated.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Interview Compass dashboard" }).first().click();
  await expectProfile(page, "Jordan Rivera");
  await expectInitials(page, "JR");
  await page.reload();
  await expectProfile(page, "Jordan Rivera");
  await page.goto("/settings");
  const newEmail = `updated-${crypto.randomUUID()}@example.test`;
  await page.getByRole("button", { name: "Change email", exact: true }).click();
  await page.getByLabel("New email address").fill(newEmail.toUpperCase());
  await page.getByRole("button", { name: "Confirm Change", exact: true }).click();
  await expect(page.getByText("Email change requested.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Current email", { exact: true })).toHaveValue(email);
  const cookie = (await context.cookies()).find((value) => value.name.endsWith("auth-token"))!;
  const id = JSON.parse(Buffer.from(cookie.value.slice(7), "base64url").toString()).user.id;
  await page.goto(`/auth/callback?type=email_change&token_hash=email-current:${id}`);
  await expect(page.getByRole("status")).toContainText("remaining email confirmation");
  await page.goto(`/auth/callback?type=email_change&token_hash=email-new:${id}`);
  await expect(page.locator("#account-current-email")).toHaveText(newEmail);
  await expect(page.getByText("Your email address has been confirmed.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Change email", exact: true }).click();
  await page.getByLabel("New email address").fill("failure@example.test");
  await page.getByRole("button", { name: "Confirm Change", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("could not be requested");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("could not be requested");
  const deletion = page.getByRole("region", { name: "Delete Account", exact: true });
  await expect(deletion).toContainText("not available on this deployment");
  await expect(deletion.getByRole("button")).toHaveCount(0);
  expect((await page.request.delete("/api/account", { data: { userId: "victim", confirmation: "DELETE" } })).status()).toBe(404);
  const anonymous = await browser.newContext();
  try { expect((await anonymous.request.delete("http://127.0.0.1:3100/api/account", { data: { confirmation: "DELETE" } })).status()).toBe(404); }
  finally { await anonymous.close(); }
  await page.screenshot({ path: testInfo.outputPath("account-settings.png"), fullPage: true });
});
