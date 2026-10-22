import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { questions } from "@/data/mock/questions";
import { gradeAnswer } from "@/features/practice/grade-answer";
import type { PracticeQuestion, PracticeResult } from "@/features/practice/types";
import { getStudyAccess } from "./access";
import { createAuthRateLimiter } from "@/server/auth/rate-limit";

const allowPractice = createAuthRateLimiter();
const lookupSchema = z.object({ questionId: z.string().max(160), submissionKey: z.uuid() }).strict();
const inputSchema = lookupSchema.extend({ answer: z.string().max(8000) }).strict();
const catalogSchema = z.object({ id: z.uuid(), question_versions: z.array(z.object({ id: z.uuid(), version: z.number().int() })) });
const feedbackSchema = z.object({ status: z.literal("saved"), kind: z.literal("graded"), selectedId: z.string(), correctOptionId: z.string(), isCorrect: z.boolean(), explanation: z.string() });
const attemptSchema = z.object({
  user_id: z.uuid(), question_id: z.uuid(), question_version_id: z.uuid(), submission_key: z.uuid(),
  submission_hash: z.string().regex(/^[a-f0-9]{64}$/), response: z.object({ answer: z.string().max(8000), practice_version: z.literal(1) }),
  state: z.enum(["graded", "submitted"]), score: z.number().min(0).max(1).nullable(), feedback: z.unknown(),
});
const columns = "user_id,question_id,question_version_id,submission_key,submission_hash,response,state,score,feedback";
const unavailable = (): PracticeResult => ({ status: "error", message: "Your answer could not be confirmed. Reload your saved answer or retry the same answer." });
type Access = NonNullable<Awaited<ReturnType<typeof getStudyAccess>>>;

async function binding(access: Access, questionId: string) {
  const result = await access.writer.from("questions").select("id,question_versions(id,version)").eq("slug", questionId).single();
  if (result.error) throw new Error("Missing question identity");
  const row = catalogSchema.parse(result.data);
  const version = row.question_versions.find((entry) => entry.version === 1);
  if (!version) throw new Error("Missing question version");
  return { questionId: row.id, versionId: version.id };
}

function outcome(raw: unknown, access: Access, question: PracticeQuestion, ids: Awaited<ReturnType<typeof binding>>, key: string, hash?: string): PracticeResult {
  const row = attemptSchema.parse(raw);
  if (row.user_id !== access.userId || row.question_id !== ids.questionId || row.question_version_id !== ids.versionId || row.submission_key !== key) throw new Error("Attempt ownership/version mismatch");
  if (hash && row.submission_hash !== hash) return { status: "error", message: "This submission was already used for another answer. Start a fresh practice to answer again." };
  if (question.kind === "multiple-choice") {
    if (row.state !== "graded") throw new Error("Feedback not released");
    const feedback = feedbackSchema.parse(row.feedback);
    if (feedback.selectedId !== row.response.answer || Number(feedback.isCorrect) !== row.score) throw new Error("Invalid feedback");
    return feedback;
  }
  if (row.state !== "submitted" || row.score !== null) throw new Error("Invalid self-review");
  return { status: "saved", kind: "self-review", draft: row.response.answer, solution: question.kind === "coding" ? question.solution : question.modelAnswer, explanation: question.explanation };
}

async function existing(access: Access, key: string) {
  // Raw attempts stay unavailable to the browser. Only this verified-owner DTO path releases feedback.
  const result = await access.writer.from("question_attempts").select(columns).eq("user_id", access.userId).eq("submission_key", key)
    .contains("response", { practice_version: 1 }).in("state", ["graded", "submitted"]).maybeSingle();
  if (result.error) throw new Error("Attempt read failed");
  return result.data;
}

export async function getPracticeSubmission(input: unknown): Promise<PracticeResult> {
  const parsed = lookupSchema.safeParse(input);
  const question = parsed.success ? questions.find((entry) => entry.id === parsed.data.questionId) : null;
  if (!parsed.success || !question) return { status: "error", message: "Invalid practice question." };
  try {
    const access = await getStudyAccess();
    if (!access) return { status: "error", message: "Sign in again to load your answer." };
    const ids = await binding(access, question.id);
    const row = await existing(access, parsed.data.submissionKey);
    return row ? outcome(row, access, question, ids, parsed.data.submissionKey) : { status: "empty" };
  } catch { return unavailable(); }
}

export async function submitPracticeAnswer(input: unknown, ip: string): Promise<PracticeResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "Invalid practice submission." };
  const { questionId, submissionKey, answer } = parsed.data;
  if (answer.includes("\u0000") || Buffer.byteLength(JSON.stringify({ answer, practice_version: 1 }), "utf8") > 32768) return { status: "error", message: "Your answer is too long or contains unsupported characters." };
  const question = questions.find((entry) => entry.id === questionId);
  if (!question || (question.kind === "multiple-choice" && !question.options.some((option) => option.id === answer))) return { status: "error", message: "Choose one of the listed answers." };
  try {
    const access = await getStudyAccess(false);
    if (!access) return { status: "error", message: "Sign in again before saving your answer." };
    const ids = await binding(access, question.id);
    // Canonical fixed-key JSON binds the idempotency key to the version and exact submitted text.
    const hash = createHash("sha256").update(JSON.stringify({ versionId: ids.versionId, answer })).digest("hex");
    const previous = await existing(access, submissionKey);
    if (previous) return outcome(previous, access, question, ids, submissionKey, hash);
    if (!allowPractice(`${access.userId}:${questionId}`, ip)) return { status: "error", message: "Too many answers. Wait a few minutes and retry." };
    const profile = await access.writer.from("profiles").upsert({ id: access.userId }, { onConflict: "id", ignoreDuplicates: true });
    if (profile.error) throw new Error("Profile bootstrap failed");
    const grade = question.kind === "multiple-choice" ? gradeAnswer(question, answer) : null;
    if (grade?.status === "invalid") return { status: "error", message: grade.message };
    const feedback = grade?.status === "graded" && question.kind === "multiple-choice"
      ? { status: "saved" as const, kind: "graded" as const, selectedId: answer, correctOptionId: question.correctOptionId, isCorrect: grade.isCorrect, explanation: grade.explanation } : null;
    const now = new Date().toISOString();
    // One immutable INSERT finalizes response + grade together. Existing uniqueness constraints
    // serialize concurrent retries. Sample questions deliberately NEVER produce mastery evidence.
    const insert = await access.writer.from("question_attempts").insert({
      user_id: access.userId, question_id: ids.questionId, question_version_id: ids.versionId,
      assignment_key: submissionKey, submission_key: submissionKey, submission_hash: hash, response: { answer, practice_version: 1 },
      state: feedback ? "graded" : "submitted", score: feedback ? Number(feedback.isCorrect) : null,
      grading_method: feedback ? "answer_key" : null, grader_version: feedback ? "sample-practice-v1" : null,
      feedback, evidence_eligible: false, created_at: now, submitted_at: now, graded_at: feedback ? now : null,
      solution_viewed_at: feedback ? null : now,
    }).select(columns).single();
    if (insert.error && insert.error.code !== "23505") throw new Error("Attempt insert failed");
    const saved = insert.error ? await existing(access, submissionKey) : insert.data;
    if (!saved) throw new Error("Unconfirmed attempt");
    return outcome(saved, access, question, ids, submissionKey, hash);
  } catch { return unavailable(); }
}
