import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLessonProgress, saveLessonProgress } from "../../src/server/learning/lesson-progress";
import { reloadLessonProgress, updateLessonProgress } from "../../src/features/curriculum/lesson-progress-actions";

const mocks = vi.hoisted(() => ({
  reader: vi.fn(), writer: vi.fn(), getUser: vi.fn(), allow: vi.fn(), headers: vi.fn(),
  catalog: vi.fn(), read: vi.fn(), profile: vi.fn(), start: vi.fn(), update: vi.fn(), filters: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.writer }));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: mocks.reader }));
vi.mock("@/lib/supabase/client", () => ({ getSupabaseConfig: () => ({ url: "https://fixture.example.test" }) }));
vi.mock("@/server/auth/rate-limit", () => ({ createAuthRateLimiter: () => mocks.allow }));
vi.mock("next/headers", () => ({ headers: mocks.headers }));

const owner = "a0000000-0000-4000-8000-000000000001";
const other = "b0000000-0000-4000-8000-000000000002";
const lesson = "b967d196-6dea-55c9-a35c-cbbd82b654b9";
const version = "3de4e9ff-3252-56ac-89ee-4a5be72ebfab";
const row = () => ({ user_id: owner, lesson_id: lesson, lesson_version_id: version, status: "started", resume_section: 0 });

function chain() {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn((...args: unknown[]) => { mocks.filters(...args); return query; }),
    single: mocks.catalog, maybeSingle: mocks.read,
    upsert: mocks.start,
    update: vi.fn((input: unknown) => { mocks.update(input); return query; }),
    // Awaitable update chain, with provider failures controlled by individual tests.
    then: (resolve: (result: { error: null }) => unknown) => Promise.resolve({ error: null }).then(resolve),
  };
  return query;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_synthetic_unit_only");
  vi.stubEnv("APP_URL", "http://localhost:3000");
  mocks.headers.mockResolvedValue(new Headers({ origin: "http://localhost:3000" }));
  mocks.allow.mockReturnValue(true);
  mocks.getUser.mockResolvedValue({ data: { user: { id: owner } }, error: null });
  mocks.reader.mockResolvedValue({ auth: { getUser: mocks.getUser }, from: () => chain() });
  mocks.writer.mockReturnValue({ from: (table: string) => table === "profiles" ? { upsert: mocks.profile } : chain() });
  mocks.catalog.mockResolvedValue({ data: { id: lesson, lesson_versions: [{ id: version, version: 1 }] }, error: null });
  mocks.read.mockResolvedValue({ data: row(), error: null });
  mocks.profile.mockResolvedValue({ error: null });
  mocks.start.mockResolvedValue({ error: null });
});

describe("persistent lesson progress boundary", () => {
  it("reads only verified-owner progress and returns a minimal DTO", async () => {
    expect(await getLessonProgress("python-variables")).toEqual({ status: "ready", progress: { status: "started", resumeSection: 0 } });
    expect(mocks.filters).toHaveBeenCalledWith("user_id", owner);
    expect(mocks.filters).toHaveBeenCalledWith("lesson_id", lesson);
    expect(mocks.getUser.mock.invocationCallOrder[0]).toBeLessThan(mocks.writer.mock.invocationCallOrder[0]);
    mocks.read.mockResolvedValue({ data: null, error: null });
    expect(await getLessonProgress("python-variables")).toEqual({ status: "ready", progress: null });
  });

  it("refuses unauthenticated reads and writes before constructing the privileged client", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await getLessonProgress("python-variables")).toMatchObject({ status: "error" });
    expect(await saveLessonProgress({ lessonId: "python-variables", operation: "start" }, "shared")).toMatchObject({ status: "error" });
    expect(mocks.writer).not.toHaveBeenCalled();
    expect(mocks.profile).not.toHaveBeenCalled();
  });

  it("rejects owner injection, unknown lessons, invalid operations, and out-of-bounds sections", async () => {
    for (const input of [
      { lessonId: "python-variables", operation: "start", user_id: other },
      { lessonId: "python-variables", operation: "start", userId: other },
      { lessonId: "missing", operation: "start" },
      { lessonId: "python-variables", operation: "delete" },
      { lessonId: "python-variables", operation: "resume", section: 3 },
      { lessonId: "python-variables", operation: "resume", section: -1 },
      { lessonId: "python-variables", operation: "resume", section: 0.5 },
      { lessonId: "python-variables", operation: "complete", section: 0 },
    ]) expect(await saveLessonProgress(input, "shared")).toMatchObject({ status: "error" });
    expect(mocks.writer).not.toHaveBeenCalled();
  });

  it("starts idempotently without overwriting an existing profile or completion", async () => {
    mocks.read.mockResolvedValue({ data: { ...row(), status: "completed", resume_section: 2 }, error: null });
    expect(await saveLessonProgress({ lessonId: "python-variables", operation: "start" }, "shared")).toMatchObject({ status: "ready", progress: { status: "completed" } });
    expect(mocks.profile).toHaveBeenCalledWith({ id: owner }, { onConflict: "id", ignoreDuplicates: true });
    expect(mocks.start).toHaveBeenCalledWith({ user_id: owner, lesson_id: lesson, lesson_version_id: version }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("bounds bookmarks and scopes completion updates to the owner's started version", async () => {
    mocks.read.mockResolvedValueOnce({ data: { ...row(), resume_section: 1 }, error: null });
    expect(await saveLessonProgress({ lessonId: "python-variables", operation: "resume", section: 1 }, "shared")).toMatchObject({ status: "ready", progress: { resumeSection: 1 } });
    expect(mocks.update).toHaveBeenCalledWith({ resume_section: 1 });
    mocks.read.mockResolvedValue({ data: { ...row(), status: "completed", resume_section: 2 }, error: null });
    expect(await saveLessonProgress({ lessonId: "python-variables", operation: "complete" }, "shared")).toMatchObject({ status: "ready", progress: { status: "completed" } });
    expect(mocks.update).toHaveBeenCalledWith({ status: "completed", resume_section: 2, completed_at: expect.any(String) });
    for (const filter of [["user_id", owner], ["lesson_id", lesson], ["lesson_version_id", version], ["status", "started"]]) expect(mocks.filters).toHaveBeenCalledWith(...filter);
  });

  it("fails closed on wrong-owner/version records, missing configuration, and provider failures", async () => {
    for (const badRow of [{ ...row(), user_id: other }, { ...row(), lesson_version_id: other }, { ...row(), resume_section: 99 }]) {
      mocks.read.mockResolvedValue({ data: badRow, error: null });
      expect(await getLessonProgress("python-variables")).toMatchObject({ status: "error" });
    }
    mocks.profile.mockResolvedValue({ error: { message: "private provider details" } });
    expect(JSON.stringify(await saveLessonProgress({ lessonId: "python-variables", operation: "start" }, "shared"))).not.toContain("private provider details");
    expect(mocks.start).not.toHaveBeenCalled();
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    expect(await getLessonProgress("python-variables")).toMatchObject({ status: "error" });
  });

  it("does not claim completion until an owned completed record can be read back", async () => {
    expect(await saveLessonProgress({ lessonId: "python-variables", operation: "complete" }, "shared")).toMatchObject({ status: "error" });
    mocks.read.mockResolvedValue({ data: null, error: null });
    expect(await saveLessonProgress({ lessonId: "python-variables", operation: "start" }, "shared")).toMatchObject({ status: "error" });
  });

  it("rejects rate-limited requests before any writes", async () => {
    mocks.allow.mockReturnValue(false);
    expect(await saveLessonProgress({ lessonId: "python-variables", operation: "start" }, "shared")).toMatchObject({ status: "error" });
    expect(mocks.profile).not.toHaveBeenCalled();
  });

  it("checks action origins before any data access", async () => {
    mocks.headers.mockResolvedValue(new Headers({ origin: "https://foreign.example.test" }));
    expect(await updateLessonProgress({ lessonId: "python-variables", operation: "start" })).toMatchObject({ status: "error" });
    expect(await reloadLessonProgress("python-variables")).toMatchObject({ status: "error" });
    expect(mocks.reader).not.toHaveBeenCalled();
  });
});
