import "server-only";
import { z } from "zod";
import { unstable_rethrow } from "next/navigation";
import { getStudyAccess } from "./access";
import { StudyConfigurationError } from "./configuration";
import { questions } from "@/data/mock/questions";
import { summarizeProgress, type LessonRecord, type AttemptRecord } from "@/features/progress/summarize-progress";
import type { StudyProgressResult } from "@/features/progress/types";

const lessonSchema = z.object({ user_id: z.uuid(), lesson_id: z.uuid(), status: z.enum(["started", "completed"]), resume_section: z.number().int().nonnegative(), updated_at: z.iso.datetime({ offset: true }) });
const attemptSchema = z.object({ id: z.uuid(), user_id: z.uuid(), question_id: z.uuid(), state: z.enum(["graded", "submitted"]), score: z.number().min(0).max(1).nullable(), created_at: z.iso.datetime({ offset: true }) });
const identitySchema = z.array(z.object({ id: z.uuid(), slug: z.string() }));

export async function getStudyProgress(pathId?: string): Promise<StudyProgressResult> {
  let stage: "access" | "catalog" | "lesson_progress" | "question_attempts" = "access";
  try {
    const access = await getStudyAccess();
    if (!access) return { status: "error", message: "Sign in again to load your study progress." };
    // Read all pages to avoid silently reporting Supabase's default first-page limit as a total.
    // Fail closed at a bounded solo-app limit; a future aggregate RPC can remove this ceiling.
    const lessonRows: LessonRecord[] = [];
    const attempts: AttemptRecord[] = [];
    stage = "catalog";
    const [lessonCatalog, questionCatalog] = await Promise.all([
      access.writer.from("lessons").select("id,slug"), access.writer.from("questions").select("id,slug"),
    ]);
    if (lessonCatalog.error || questionCatalog.error) throw new Error("Catalog unavailable");
    const lessonSlugs = new Map(identitySchema.parse(lessonCatalog.data).map((row) => [row.id, row.slug]));
    const questionSlugs = new Map(identitySchema.parse(questionCatalog.data).map((row) => [row.id, row.slug]));
    for (const table of ["lesson_progress", "question_attempts"] as const) {
      stage = table;
      let cursor: string | undefined;
      let rowsRead = 0;
      for (;;) {
        if (rowsRead >= 10_000) throw new Error("History requires server aggregation");
        const query = table === "lesson_progress"
          ? access.reader.from(table).select("user_id,lesson_id,status,resume_section,updated_at").eq("user_id", access.userId).order("lesson_id")
          : access.writer.from(table).select("id,user_id,question_id,state,score,created_at").eq("user_id", access.userId)
            .contains("response", { practice_version: 1 }).in("state", ["graded", "submitted"]).order("id");
        // Keyset pagination avoids counting a row twice when another tab inserts during a read.
        const result = await (cursor ? query.gt(table === "lesson_progress" ? "lesson_id" : "id", cursor) : query).range(0, Math.min(499, 9_999 - rowsRead));
        if (result.error || !Array.isArray(result.data)) throw new Error("Progress unavailable");
        // The API may impose a lower row cap than requested. Only an empty page proves the end.
        if (result.data.length === 0) break;
        rowsRead += result.data.length;
        for (const raw of result.data) {
          if (table === "lesson_progress") {
            const row = lessonSchema.parse(raw);
            if (cursor && row.lesson_id <= cursor) throw new Error("Invalid history order");
            cursor = row.lesson_id;
            if (row.user_id !== access.userId) throw new Error("Ownership mismatch");
            lessonRows.push({ slug: lessonSlugs.get(row.lesson_id) ?? "", status: row.status, resumeSection: row.resume_section, updatedAt: new Date(row.updated_at).toISOString() });
          } else {
            const row = attemptSchema.parse(raw);
            if (cursor && row.id <= cursor) throw new Error("Invalid history order");
            cursor = row.id;
            if (row.user_id !== access.userId || (row.state === "graded" ? row.score === null : row.score !== null)) throw new Error("Invalid practice summary");
            const question = questions.find((entry) => entry.id === questionSlugs.get(row.question_id));
            attempts.push({ id: row.id, topicId: question?.topicId ?? null, title: question?.prompt ?? "Earlier practice question", state: row.state, score: row.score, at: new Date(row.created_at).toISOString() });
          }
        }
      }
    }
    return { status: "ready", data: summarizeProgress(lessonRows, attempts, new Date(), pathId) };
  } catch (error) {
    unstable_rethrow(error);
    // Fixed server diagnostics only: never log SDK errors, keys, URLs, row data, or actor IDs.
    const code = error instanceof StudyConfigurationError ? error.code : "data_unavailable";
    console.error(`[study-progress] ${stage}: ${code}. Run npm run check:study; see DEVELOPER_GUIDE.md.`);
    return { status: "error", message: error instanceof StudyConfigurationError
      ? "Study progress is unavailable while saved progress is being set up. Please try again later."
      : "Study progress is unavailable. Reload the page to try again." };
  }
}
