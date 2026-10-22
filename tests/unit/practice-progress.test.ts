import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { submitPracticeAnswer, getPracticeSubmission } from "../../src/server/learning/practice-progress";
import { publicQuestions } from "../../src/server/learning/question-bank";

const mocks = vi.hoisted(() => ({ access: vi.fn(), allow: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/learning/access", () => ({ getStudyAccess: mocks.access }));
vi.mock("@/server/auth/rate-limit", () => ({ createAuthRateLimiter: () => mocks.allow }));
const owner = "a0000000-0000-4000-8000-000000000001";
const other = "b0000000-0000-4000-8000-000000000002";
const questionId = "d6946209-76b6-59b4-beff-8c0a6251fda9";
const versionId = "bad65157-3d32-562e-9981-810904d238f7";
const key = "f0000000-0000-4000-8000-000000000001";
const rows = new Map<string, Record<string, unknown>>();
const calls: { table: string; method: string; input?: Record<string, unknown> }[] = [];
let failInsert = false;
let leakRead = false;
let lostResponse = false;

function actor(userId: string) {
  const client = createClient("https://fixture.example.test", "sb_secret_fixture", { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async (input, init) => {
    const url = new URL(String(input));
    const table = url.pathname.split("/").at(-1)!;
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined;
    calls.push({ table, method, input: body });
    const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
    if (table === "questions") return response({ id: questionId, question_versions: [{ id: versionId, version: 1 }] });
    if (table === "profiles") return response({});
    if (table === "question_attempts" && method === "POST") {
      if (failInsert) return response({ code: "42501", message: "private provider failure" }, 403);
      const rowKey = `${body!.user_id}:${body!.submission_key}`;
      if (rows.has(rowKey)) return response({ code: "23505" }, 409);
      rows.set(rowKey, body!);
      if (lostResponse) { lostResponse = false; return response({ code: "failed_after_commit" }, 400); }
      return response(body, 201);
    }
    const filter = (name: string) => url.searchParams.get(name)?.slice(3);
    return response([...rows.values()].filter((row) => (leakRead || row.user_id === filter("user_id")) && row.submission_key === filter("submission_key")));
  } } });
  mocks.access.mockResolvedValue({ userId, reader: client, writer: client });
}
const submission = (answer = "b") => ({ questionId: "python-types", submissionKey: key, answer });
beforeEach(() => { vi.resetAllMocks(); rows.clear(); calls.length = 0; failInsert = false; leakRead = false; lostResponse = false; mocks.allow.mockReturnValue(true); actor(owner); });

describe("immutable practice persistence", () => {
  it("strips every key, solution, and explanation from public question DTOs", () => {
    const text = JSON.stringify(publicQuestions());
    for (const field of ["correctOptionId", "modelAnswer", "solution", "explanation"]) expect(text).not.toContain(`"${field}":`);
  });
  it("saves server-computed grades once and restores them", async () => {
    expect(await submitPracticeAnswer(submission(), "ip")).toMatchObject({ status: "saved", kind: "graded", isCorrect: true });
    expect(await submitPracticeAnswer(submission(), "ip")).toMatchObject({ status: "saved", isCorrect: true });
    expect(await getPracticeSubmission({ questionId: "python-types", submissionKey: key })).toMatchObject({ status: "saved", selectedId: "b" });
    expect(rows.size).toBe(1);
    const saved = [...rows.values()][0];
    expect(saved).toMatchObject({ user_id: owner, state: "graded", score: 1, evidence_eligible: false, grading_method: "answer_key" });
    expect(saved.created_at).toBe(saved.submitted_at);
    expect(saved.graded_at).toBe(saved.submitted_at);
    expect(calls.filter((call) => call.method === "POST" && call.table === "question_attempts")).toHaveLength(1);
    expect(calls.some((call) => call.method === "PATCH")).toBe(false);
  });
  it("deduplicates concurrent identical submissions and rejects changed payload replays", async () => {
    const results = await Promise.all([submitPracticeAnswer(submission(), "ip"), submitPracticeAnswer(submission(), "ip")]);
    expect(results.every((result) => result.status === "saved")).toBe(true);
    expect(rows.size).toBe(1);
    expect(await submitPracticeAnswer(submission("a"), "ip")).toMatchObject({ status: "error", message: expect.stringContaining("already used") });
    expect([...rows.values()][0].score).toBe(1);
  });
  it("recovers a committed submission after its response is lost", async () => {
    lostResponse = true;
    expect(await submitPracticeAnswer(submission(), "ip")).toMatchObject({ status: "error" });
    expect(await submitPracticeAnswer(submission(), "ip")).toMatchObject({ status: "saved", isCorrect: true });
    expect(rows.size).toBe(1);
  });
  it("never releases feedback from records outside the free-practice workflow", async () => {
    await submitPracticeAnswer(submission(), "ip");
    const row = [...rows.values()][0];
    row.response = { answer: "b", practice_version: 2 };
    expect(await getPracticeSubmission({ questionId: "python-types", submissionKey: key })).toMatchObject({ status: "error" });
    expect(await submitPracticeAnswer(submission(), "ip")).toMatchObject({ status: "error" });
  });
  it("isolates accounts even when both use the same submission key", async () => {
    await submitPracticeAnswer(submission(), "ip");
    actor(other);
    expect(await getPracticeSubmission({ questionId: "python-types", submissionKey: key })).toEqual({ status: "empty" });
    await submitPracticeAnswer(submission("a"), "ip");
    expect(rows.size).toBe(2);
    leakRead = true;
    expect(await getPracticeSubmission({ questionId: "python-types", submissionKey: key })).toMatchObject({ status: "error" });
  });
  it("rejects anonymous requests, forged scores/owners, and invalid options", async () => {
    for (const input of [{ ...submission(), user_id: other }, { ...submission(), score: 1 }, submission("forged"), submission("\u0000"), submission("\u0001".repeat(8000))]) expect(await submitPracticeAnswer(input, "ip")).toMatchObject({ status: "error" });
    mocks.access.mockResolvedValue(null);
    expect(await submitPracticeAnswer(submission(), "ip")).toMatchObject({ status: "error" });
    expect(await getPracticeSubmission({ questionId: "python-types", submissionKey: key })).toMatchObject({ status: "error" });
    expect(calls).toHaveLength(0);
  });
  it("persists self-review without fabricating a grade or executing a draft", async () => {
    const result = await submitPracticeAnswer({ questionId: "stack-concept", submissionKey: key, answer: "LIFO" }, "ip");
    expect(result).toMatchObject({ status: "saved", kind: "self-review", draft: "LIFO" });
    expect([...rows.values()][0]).toMatchObject({ state: "submitted", score: null, grading_method: null, feedback: null, evidence_eligible: false });
  });
  it("fails safely for provider errors and rate limits without returning a local grade", async () => {
    failInsert = true;
    const result = await submitPracticeAnswer(submission(), "ip");
    expect(result).toMatchObject({ status: "error" });
    expect(JSON.stringify(result)).not.toContain("private provider failure");
    expect(rows.size).toBe(0);
    mocks.allow.mockReturnValue(false);
    expect(await submitPracticeAnswer(submission(), "ip")).toMatchObject({ status: "error" });
  });
});
