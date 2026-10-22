import { beforeEach, describe, expect, it, vi } from "vitest";
import { accountProfile } from "../../src/features/auth/profile";
import { saveStudyPreferences } from "../../src/features/settings/preference-actions";
import { defaultStudyPreferences, interviewDaysRemaining, isCalendarDate, isTimeZone, preferencesUpdateSchema } from "../../src/features/settings/study-preferences";

const mocks = vi.hoisted(() => ({ headers: vi.fn(), client: vi.fn(), identity: vi.fn(), update: vi.fn(), allow: vi.fn(), revalidate: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.client }));
vi.mock("@/server/auth/rate-limit", () => ({ createAuthRateLimiter: () => mocks.allow }));

const settings = { dailyMinutes: 45, explanationLevel: "advanced", theme: "dark", timezone: "Pacific/Kiritimati", interviewDate: "2028-02-29" };
const metadata = { daily_minutes: 45, explanation_level: "advanced", theme: "dark", timezone: "Pacific/Kiritimati", interview_date: "2028-02-29" };
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("APP_URL", "http://localhost:3000");
  mocks.headers.mockResolvedValue(new Headers({ origin: "http://localhost:3000" }));
  mocks.client.mockResolvedValue({ auth: { getUser: mocks.identity, updateUser: mocks.update } });
  mocks.identity.mockResolvedValue({ data: { user: { id: "actor" } }, error: null });
  mocks.update.mockResolvedValue({ data: { user: { id: "actor", user_metadata: metadata } }, error: null });
  mocks.allow.mockReturnValue(true);
});

describe("saved preferences validation and calendar dates", () => {
  it("gives stable defaults and independently validates untrusted/legacy metadata", () => {
    expect(accountProfile({ id: "actor" }).studyPreferences).toEqual(defaultStudyPreferences);
    expect(accountProfile({ id: "actor", user_metadata: { ...metadata, daily_minutes: "45", timezone: "+14:00", interview_date: "2027-02-29" } }).studyPreferences)
      .toEqual({ ...defaultStudyPreferences, theme: "dark", explanationLevel: "advanced" });
    expect(accountProfile({ id: "actor", user_metadata: metadata }).studyPreferences).toEqual(settings);
  });
  it.each(["2028-02-29", "2000-02-29", "0001-01-01", "9999-12-31"]) ("accepts a real date without converting it: %s", (date) => {
    expect(isCalendarDate(date)).toBe(true);
    expect(preferencesUpdateSchema.parse({ interviewDate: date }).interviewDate).toBe(date);
  });
  it.each(["2027-02-29", "1900-02-29", "2026-04-31", "0000-01-01", "2026-00-10", "2026-01-00", "2026-13-01", "2026-1-1", "2026-10-22T00:00:00Z"]) ("rejects invalid or timestamp dates: %s", (date) => {
    expect(isCalendarDate(date)).toBe(false);
  });
  it("accepts supported IANA names and rejects invalid zones/offsets", () => {
    for (const zone of ["UTC", "America/Indiana/Indianapolis", "Pacific/Kiritimati", "Pacific/Pago_Pago", "Etc/GMT+12"]) expect(isTimeZone(zone)).toBe(true);
    for (const zone of ["", "Mars/Invalid", "+14:00", "GMT-0500", " America/New_York ", "../UTC"]) expect(isTimeZone(zone)).toBe(false);
  });
  it("counts days from the selected zone across the date line and DST, without shifting stored dates", () => {
    const now = new Date("2026-10-22T10:30:00Z");
    expect(interviewDaysRemaining("2026-10-23", "Pacific/Kiritimati", now)).toBe(0);
    expect(interviewDaysRemaining("2026-10-23", "Pacific/Pago_Pago", now)).toBe(2);
    expect(interviewDaysRemaining("2026-03-09", "America/New_York", new Date("2026-03-08T06:30:00Z"))).toBe(1);
    expect(interviewDaysRemaining("2026-11-02", "America/New_York", new Date("2026-11-01T05:30:00Z"))).toBe(1);
    expect(interviewDaysRemaining("2026-10-20", "UTC", now)).toBe(-2);
  });
});

describe("verified-owner preference action", () => {
  it("saves the supplied fields and confirms the actor and exact values before success", async () => {
    expect(await saveStudyPreferences(settings)).toMatchObject({ status: "success" });
    expect(mocks.update).toHaveBeenCalledWith({ data: metadata });
    expect(mocks.identity.mock.invocationCallOrder[0]).toBeLessThan(mocks.update.mock.invocationCallOrder[0]);
    expect(mocks.revalidate).toHaveBeenCalledWith("/", "layout");
  });
  it("patches theme alone while preserving profile, path, unrelated metadata, and other settings", async () => {
    const existing = { id: "actor", user_metadata: { first_name: "Taylor", career_path_id: "business-analytics", unrelated: { keep: true }, ...metadata } };
    mocks.identity.mockResolvedValue({ data: { user: existing }, error: null });
    mocks.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ data: { user: { ...existing, user_metadata: { ...existing.user_metadata, ...data } } }, error: null }));
    expect(await saveStudyPreferences({ theme: "light" })).toMatchObject({ status: "success" });
    expect(mocks.update).toHaveBeenCalledWith({ data: { theme: "light" } });
    expect(existing.user_metadata).toMatchObject({ first_name: "Taylor", career_path_id: "business-analytics", unrelated: { keep: true }, interview_date: "2028-02-29" });
  });
  it("edits and clears the interview date with explicit null, and can save a path with settings", async () => {
    mocks.update.mockResolvedValueOnce({ data: { user: { id: "actor", user_metadata: { interview_date: "2027-01-01" } } }, error: null })
      .mockResolvedValueOnce({ data: { user: { id: "actor", user_metadata: {} } }, error: null })
      .mockResolvedValueOnce({ data: { user: { id: "actor", user_metadata: { ...metadata, career_path_id: "data-science" } } }, error: null });
    expect(await saveStudyPreferences({ interviewDate: "2027-01-01" })).toMatchObject({ status: "success" });
    expect(await saveStudyPreferences({ interviewDate: null })).toMatchObject({ status: "success" });
    expect(mocks.update).toHaveBeenCalledWith({ data: { interview_date: null } });
    expect(await saveStudyPreferences({ ...settings, careerPathId: "data-science" })).toMatchObject({ status: "success" });
    mocks.update.mockResolvedValueOnce({ data: { user: { id: "actor", user_metadata: { interview_date: null } } }, error: null });
    expect(await saveStudyPreferences({ interviewDate: null })).toMatchObject({ status: "success" });
  });
  it("rejects invalid values and injected ownership before data access", async () => {
    for (const input of [null, {}, { theme: "system" }, { dailyMinutes: 4 }, { dailyMinutes: 241 }, { dailyMinutes: 30.5 }, { dailyMinutes: "30" }, { explanationLevel: "expert" }, { timezone: "fake" }, { interviewDate: "" }, { interviewDate: "2027-02-29" }, { theme: "dark", user_id: "other" }, { careerPathId: "unknown" }]) {
      expect(await saveStudyPreferences(input)).toMatchObject({ status: "error" });
    }
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("rejects foreign origins, missing/revoked identity, and rate limits without mutation", async () => {
    mocks.headers.mockResolvedValueOnce(new Headers({ origin: "https://evil.test" }));
    expect(await saveStudyPreferences(settings)).toMatchObject({ status: "error" });
    mocks.identity.mockResolvedValueOnce({ data: { user: null }, error: null });
    expect(await saveStudyPreferences(settings)).toMatchObject({ status: "error" });
    mocks.identity.mockResolvedValueOnce({ data: { user: { id: "actor" } }, error: { status: 401 } });
    expect(await saveStudyPreferences(settings)).toMatchObject({ status: "error" });
    mocks.allow.mockReturnValueOnce(false);
    expect(await saveStudyPreferences(settings)).toMatchObject({ status: "error" });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not claim success for provider failures, wrong actors, missing/null-mismatched echoes; retry can succeed", async () => {
    for (const result of [ { data: { user: null }, error: { message: "private" } }, { data: { user: { id: "other", user_metadata: metadata } }, error: null }, { data: { user: { id: "actor", user_metadata: {} } }, error: null } ]) {
      mocks.update.mockResolvedValueOnce(result);
      const failed = await saveStudyPreferences(settings);
      expect(failed.status).toBe("error"); expect(JSON.stringify(failed)).not.toContain("private");
    }
    expect(await saveStudyPreferences({ interviewDate: null })).toMatchObject({ status: "error" });
    mocks.update.mockRejectedValueOnce(new Error("private"));
    expect(await saveStudyPreferences(settings)).toMatchObject({ status: "error" });
    expect(mocks.revalidate).not.toHaveBeenCalled();
    expect(await saveStudyPreferences(settings)).toMatchObject({ status: "success" });
  });
});
