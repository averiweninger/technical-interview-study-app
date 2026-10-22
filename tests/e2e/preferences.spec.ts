import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signIn } from "./auth-fixture";

async function logout(page: Page) {
  await page.getByRole("button", { name: "Account menu", exact: true }).click();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
}
async function save(page: Page) {
  await page.getByRole("button", { name: "Save preferences", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Preferences saved" })).toBeVisible();
}

test("preferences restore per account without changing metadata, path, study history, or calendar date", async ({ page, request }, testInfo) => {
  test.setTimeout(120_000);
  const hydrationErrors: string[] = [];
  page.on("pageerror", (error) => hydrationErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && /hydrat|did not match/i.test(message.text())) hydrationErrors.push(message.text()); });
  const email = await signIn(page, `preference-persist-${crypto.randomUUID()}@example.test`);
  await page.goto("/lessons/python-variables");
  await page.getByRole("button", { name: "Start lesson", exact: true }).click();
  await page.getByRole("button", { name: "Mark lesson complete", exact: true }).click();
  await expect(page.getByRole("button", { name: "Lesson complete", exact: true })).toBeDisabled();
  await page.goto("/practice?topic=python");
  await page.getByRole("radio", { name: "B. String (str)" }).check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.getByText("Correct. Nicely reasoned.", { exact: true })).toBeVisible();
  await page.goto("/settings");
  await expect(page.getByLabel("Preferred career path")).toHaveValue("business-analytics");
  await page.getByLabel("Daily study goal (minutes)").fill("45");
  await page.getByLabel("Preferred explanation level").selectOption("advanced");
  await page.getByLabel("Timezone", { exact: true }).fill("Pacific/Kiritimati");
  await page.getByLabel("Interview date (optional)").fill("2028-02-29");
  await page.getByLabel("Theme", { exact: true }).selectOption("dark");
  // Draft appearance cannot be mistaken for a saved theme.
  await expect(page.locator('[data-theme="light"]')).toBeVisible();
  await save(page);
  await page.reload();
  await expect(page.locator('[data-theme="dark"]')).toBeVisible();
  await expect(page.getByLabel("Daily study goal (minutes)")).toHaveValue("45");
  await expect(page.getByLabel("Preferred explanation level")).toHaveValue("advanced");
  await expect(page.getByLabel("Timezone", { exact: true })).toHaveValue("Pacific/Kiritimati");
  await expect(page.getByLabel("Interview date (optional)")).toHaveValue("2028-02-29");
  const findings = await new AxeBuilder({ page }).analyze();
  expect(findings.violations.filter((entry) => entry.impact === "serious" || entry.impact === "critical")).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("saved-preferences.png"), fullPage: true, caret: "initial" });
  const html = await page.request.get("/dashboard");
  expect(await html.text()).toContain('data-theme="dark"');
  await page.goto("/dashboard");
  await expect(page.getByText("Interview date:", { exact: false })).toContainText("2028-02-29 (Pacific/Kiritimati)");
  await logout(page);
  await signIn(page);
  await page.goto("/settings");
  await expect(page.getByLabel("Daily study goal (minutes)")).toHaveValue("30");
  await expect(page.getByLabel("Preferred explanation level")).toHaveValue("beginner");
  await expect(page.getByLabel("Timezone", { exact: true })).toHaveValue("UTC");
  await expect(page.getByLabel("Interview date (optional)")).toHaveValue("");
  await expect(page.getByLabel("Theme", { exact: true })).toHaveValue("light");
  await page.getByLabel("Daily study goal (minutes)").fill("60");
  await save(page);
  await logout(page);
  await signIn(page, email);
  await page.goto("/settings");
  await expect(page.getByLabel("Daily study goal (minutes)")).toHaveValue("45");
  await expect(page.getByLabel("Preferred explanation level")).toHaveValue("advanced");
  await expect(page.getByLabel("Theme", { exact: true })).toHaveValue("dark");
  await expect(page.getByLabel("Preferred career path")).toHaveValue("business-analytics");
  // Date and zone can change together; clearing sends explicit null rather than omitting the key.
  await page.getByLabel("Timezone", { exact: true }).fill("Etc/GMT+12");
  await page.getByLabel("Interview date (optional)").fill("2029-01-01");
  await save(page);
  await page.reload();
  await expect(page.getByLabel("Interview date (optional)")).toHaveValue("2029-01-01");
  await expect(page.getByLabel("Timezone", { exact: true })).toHaveValue("Etc/GMT+12");
  await page.getByRole("button", { name: "Clear interview date", exact: true }).click();
  await save(page);
  await page.reload();
  await expect(page.getByLabel("Interview date (optional)")).toHaveValue("");
  await page.goto("/dashboard");
  await expect(page.getByText("Interview date:", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Primary path:", { exact: false })).toContainText("Business Analytics");
  await expect(page.getByText("1 / 6", { exact: true })).toBeVisible();
  await expect(page.getByText("Practice score: 100%", { exact: true })).toBeVisible();
  const identity = await request.post("http://127.0.0.1:54329/auth/v1/token?grant_type=password", { data: { email, password: "Synthetic-passphrase-123" } });
  const record = await identity.json() as { user: { user_metadata: Record<string, unknown> } };
  expect(record.user.user_metadata).toMatchObject({ first_name: "Taylor", last_name: "Saved", unrelated_marker: "keep-fixture-metadata", career_path_id: "business-analytics" });
  expect(record.user.user_metadata).not.toHaveProperty("interview_date");
  expect(hydrationErrors).toEqual([]);
});

test("invalid and failed preference saves remain drafts and support deliberate retries, including the header theme", async ({ page }) => {
  await signIn(page, `preference-retry-${crypto.randomUUID()}@example.test`);
  await page.goto("/settings");
  await page.getByLabel("Timezone", { exact: true }).fill("Mars/Invalid");
  await page.getByRole("button", { name: "Save preferences", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("valid IANA timezone");
  await page.getByLabel("Timezone", { exact: true }).fill("America/Indiana/Indianapolis");
  await page.getByLabel("Daily study goal (minutes)").fill("90");
  await page.getByLabel("Theme", { exact: true }).selectOption("dark");
  let releaseSave: () => void = () => {};
  const gate = new Promise<void>((resolve) => { releaseSave = resolve; });
  let saves = 0;
  await page.route("**/settings", async (route) => {
    if (route.request().method() === "POST") { saves++; await gate; }
    await route.continue();
  });
  await page.getByRole("button", { name: "Save preferences", exact: true }).dblclick();
  await expect(page.getByRole("button", { name: "Saving preferences...", exact: true })).toBeDisabled();
  await expect(page.getByLabel("Timezone", { exact: true })).toBeDisabled();
  releaseSave();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("could not be confirmed as saved");
  expect(saves).toBe(1);
  await page.unroute("**/settings");
  await expect(page.locator('[data-theme="light"]')).toBeVisible();
  await expect(page.getByText("Unsaved changes.", { exact: false })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Preferences saved" })).toHaveCount(0);
  await save(page);
  await expect(page.locator('[data-theme="dark"]')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Daily study goal (minutes)")).toHaveValue("90");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("could not be confirmed as saved");
  await expect(page.locator('[data-theme="dark"]')).toBeVisible();
  // A header change updates clean draft fields without discarding an in-progress daily-goal edit.
  await page.getByLabel("Daily study goal (minutes)").fill("120");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator('[data-theme="light"]')).toBeVisible();
  await expect(page.getByLabel("Theme", { exact: true })).toHaveValue("light");
  await expect(page.getByLabel("Daily study goal (minutes)")).toHaveValue("120");
  await save(page);
  await page.reload();
  await expect(page.locator('[data-theme="light"]')).toBeVisible();
  await expect(page.getByLabel("Daily study goal (minutes)")).toHaveValue("120");
});
