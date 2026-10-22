import { beforeEach, describe, expect, it, vi } from "vitest";
import { practiceAction } from "../../src/features/practice/actions";

const mocks = vi.hoisted(() => ({ headers: vi.fn(), submit: vi.fn(), load: vi.fn(), revalidate: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/server/learning/practice-progress", () => ({ submitPracticeAnswer: mocks.submit, getPracticeSubmission: mocks.load }));
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("APP_URL", "http://localhost:3000");
  mocks.headers.mockResolvedValue(new Headers({ origin: "http://localhost:3000" }));
});
describe("practice action request boundary", () => {
  it("rejects cross-origin and missing-origin requests before touching persistence", async () => {
    for (const origin of ["https://foreign.example.test", ""]) {
      mocks.headers.mockResolvedValue(new Headers(origin ? { origin } : {}));
      expect(await practiceAction("submit", {})).toMatchObject({ status: "error" });
    }
    expect(mocks.submit).not.toHaveBeenCalled(); expect(mocks.load).not.toHaveBeenCalled();
  });
  it("invalidates both account progress pages only after a confirmed save", async () => {
    mocks.submit.mockResolvedValueOnce({ status: "error", message: "Not saved" });
    await practiceAction("submit", {});
    expect(mocks.revalidate).not.toHaveBeenCalled();
    mocks.submit.mockResolvedValueOnce({ status: "saved", kind: "graded", isCorrect: true });
    expect(await practiceAction("submit", {})).toMatchObject({ status: "saved" });
    expect(mocks.revalidate).toHaveBeenCalledWith("/dashboard");
    expect(mocks.revalidate).toHaveBeenCalledWith("/progress");
  });
  it("does not mutate on restore and redacts unexpected failures", async () => {
    mocks.load.mockResolvedValue({ status: "empty" });
    expect(await practiceAction("load", {})).toEqual({ status: "empty" });
    expect(mocks.submit).not.toHaveBeenCalled(); expect(mocks.revalidate).not.toHaveBeenCalled();
    mocks.load.mockRejectedValue(new Error("private provider diagnostic"));
    const result = await practiceAction("load", {});
    expect(result).toMatchObject({ status: "error" });
    expect(JSON.stringify(result)).not.toContain("private provider diagnostic");
  });
});
