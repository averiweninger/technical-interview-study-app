import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { summarizeProgress, type AttemptRecord } from "../../src/features/progress/summarize-progress";
import { getStudyProgress } from "../../src/server/learning/study-progress";
import { StudyConfigurationError } from "../../src/server/learning/configuration";

const mocks = vi.hoisted(() => ({ access: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/learning/access", () => ({ getStudyAccess: mocks.access }));
const owner = "a0000000-0000-4000-8000-000000000001";
const other = "b0000000-0000-4000-8000-000000000002";
const lessonId = "b967d196-6dea-55c9-a35c-cbbd82b654b9";
const questionId = "d6946209-76b6-59b4-beff-8c0a6251fda9";
const at = "2026-10-21T10:00:00.000Z";
const urls: URL[] = [];
let wrongOwner = false;
let providerFailure = false;
let historySize = 1;
let pageLimit = 500;
let ignoreCursor = false;

beforeEach(() => {
  vi.restoreAllMocks(); vi.resetAllMocks(); urls.length = 0; wrongOwner = false; providerFailure = false; historySize = 1; pageLimit = 500; ignoreCursor = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
  const client = createClient("https://fixture.example.test", "sb_secret_fixture", { auth: { persistSession: false }, global: { fetch: async (input) => {
    const url = new URL(String(input)); urls.push(url);
    const table = url.pathname.split("/").at(-1);
    const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
    if (providerFailure) return response({ code: "42501", message: "private diagnostic" }, 403);
    if (table === "lessons") return response([{ id: lessonId, slug: "python-variables" }]);
    if (table === "questions") return response([{ id: questionId, slug: "python-types" }]);
    if (table === "lesson_progress") return response(url.searchParams.has("lesson_id") ? [] : [{ user_id: wrongOwner ? other : owner, lesson_id: lessonId, status: "completed", resume_section: 2, updated_at: at }]);
    const cursor = ignoreCursor ? "" : url.searchParams.get("id")?.replace(/^gt\./, "") ?? "";
    const history = Array.from({ length: historySize }, (_, index) => ({ id: `f0000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`, user_id: owner, question_id: questionId, state: "graded", score: 1, created_at: at }));
    return response(history.filter((row) => row.id > cursor).slice(0, Math.min(pageLimit, Number(url.searchParams.get("limit") ?? 500))));
  } } });
  mocks.access.mockResolvedValue({ userId: owner, writer: client, reader: client });
});

describe("account-specific study summaries", () => {
  it("has honest empty metrics, an available lesson, and zero daily submissions", () => {
    const snapshot = summarizeProgress([], [], new Date(at));
    expect(snapshot).toMatchObject({ completedLessons: 0, gradedAttempts: 0, selfReviews: 0, accuracy: null });
    expect(snapshot.continueLesson?.id).toBe("python-variables");
    expect(snapshot.days).toHaveLength(7);
    expect(snapshot.days.every((day) => day.count === 0)).toBe(true);
    expect(snapshot.topics.every((topic) => topic.accuracy === null)).toBe(true);
    expect(snapshot).not.toHaveProperty("streak");
    expect(snapshot).not.toHaveProperty("mastery");
  });
  it("separates lesson completion, objective scores, and ungraded review", () => {
    const attempts: AttemptRecord[] = [
      { id: "first", topicId: "python", title: "Question", state: "graded", score: 1, at },
      { id: "second", topicId: "python", title: "Question", state: "graded", score: 0, at },
      { id: "review", topicId: "python", title: "Review", state: "submitted", score: null, at },
    ];
    const snapshot = summarizeProgress([
      { slug: "python-variables", status: "completed", resumeSection: 2, updatedAt: at },
      { slug: "python-loops", status: "started", resumeSection: 1, updatedAt: at },
    ], attempts, new Date(at));
    expect(snapshot).toMatchObject({ completedLessons: 1, gradedAttempts: 2, selfReviews: 1, accuracy: 50 });
    expect(snapshot.continueLesson).toMatchObject({ id: "python-loops", section: 1 });
    expect(snapshot.days.at(-1)?.count).toBe(3);
    expect(snapshot.topics.find((topic) => topic.topicId === "python")).toMatchObject({ completed: 1, answered: 2, accuracy: 50 });
  });
  it("scopes every persistence query to the verified actor and practice-only projection", async () => {
    const result = await getStudyProgress();
    expect(result).toMatchObject({ status: "ready", data: { completedLessons: 1, gradedAttempts: 1, accuracy: 100 } });
    for (const url of urls.filter((url) => /lesson_progress|question_attempts/.test(url.pathname))) expect(url.searchParams.get("user_id")).toBe(`eq.${owner}`);
    const attempts = urls.find((url) => url.pathname.endsWith("question_attempts"))!;
    expect(attempts.searchParams.get("response")).toContain("practice_version");
    expect(attempts.searchParams.get("select")).not.toContain("feedback");
    expect(attempts.searchParams.get("select")).not.toContain("response");
  });
  it("never substitutes sample or zero statistics when authorization or data fails", async () => {
    wrongOwner = true;
    expect(await getStudyProgress()).toMatchObject({ status: "error" });
    wrongOwner = false; providerFailure = true;
    expect(JSON.stringify(await getStudyProgress())).not.toContain("private diagnostic");
    mocks.access.mockResolvedValue(null);
    const before = urls.length;
    expect(await getStudyProgress()).toMatchObject({ status: "error" });
    expect(urls.length).toBe(before);
  });
  it("reads beyond one API page without counting records twice", async () => {
    historySize = 501;
    expect(await getStudyProgress()).toMatchObject({ status: "ready", data: { gradedAttempts: 501, accuracy: 100 } });
    const pages = urls.filter((url) => url.pathname.endsWith("question_attempts"));
    expect(pages).toHaveLength(3);
    expect(pages[1].searchParams.get("id")).toMatch(/^gt\./);
  });
  it("does not truncate totals when the API returns fewer rows than requested", async () => {
    historySize = 5; pageLimit = 2;
    expect(await getStudyProgress()).toMatchObject({ status: "ready", data: { gradedAttempts: 5 } });
    expect(urls.filter((url) => url.pathname.endsWith("question_attempts"))).toHaveLength(4);
  });
  it("fails safely at the record cap and when a provider repeats a page", async () => {
    historySize = 10_000;
    expect(await getStudyProgress()).toMatchObject({ status: "error" });
    historySize = 2; ignoreCursor = true;
    expect(await getStudyProgress()).toMatchObject({ status: "error" });
  });
  it("identifies missing setup in fixed diagnostics without leaking raw error content", async () => {
    mocks.access.mockRejectedValue(new StudyConfigurationError("server_key_missing"));
    expect(await getStudyProgress()).toMatchObject({ status: "error", message: expect.stringContaining("being set up") });
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("server_key_missing"));
    mocks.access.mockRejectedValue(new Error("private diagnostic token"));
    await getStudyProgress();
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("private diagnostic token");
  });
});
