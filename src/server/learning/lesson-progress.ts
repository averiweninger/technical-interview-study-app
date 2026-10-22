import "server-only";
import { z } from "zod";
import { lessons } from "@/data/mock/lessons";
import { getStudyAccess } from "./access";
import { createAuthRateLimiter } from "@/server/auth/rate-limit";
import type { LessonProgressResult } from "@/features/curriculum/lesson-progress-types";

const allowProgressAttempt = createAuthRateLimiter();
const requestSchema = z.object({
  lessonId: z.string().max(160), operation: z.enum(["start", "resume", "complete"]),
  section: z.number().int().nonnegative().optional(),
}).strict();
const bindingSchema = z.object({ id: z.uuid(), lesson_versions: z.array(z.object({ id: z.uuid(), version: z.number().int() })) });
const recordSchema = z.object({
  user_id: z.uuid(), lesson_id: z.uuid(), lesson_version_id: z.uuid(),
  status: z.enum(["started", "completed"]), resume_section: z.number().int().nonnegative(),
});
const failure = (): LessonProgressResult => ({ status: "error", message: "Lesson progress is unavailable. Please try again. You can still read the lesson." });

/** Verify identity at both entry points; callers cannot supply an owner or database UUID. */
async function accessLesson(lessonId: unknown, readOnly: boolean) {
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) throw new Error("Unknown lesson");
  const access = await getStudyAccess(readOnly);
  if (!access) return null;
  const { reader, writer, userId } = access;
  // Resolve existing permanent UUIDs by the shared slug; do not invent a second ID mapping.
  const binding = await writer.from("lessons").select("id,lesson_versions(id,version)").eq("slug", lesson.id).single();
  if (binding.error) throw new Error("Missing lesson identity");
  const catalog = bindingSchema.parse(binding.data);
  const version = catalog.lesson_versions.find((item) => item.version === 1);
  if (!version) throw new Error("Missing lesson version");
  return { reader, writer, userId, lesson, lessonUuid: catalog.id, versionUuid: version.id };
}

type Access = NonNullable<Awaited<ReturnType<typeof accessLesson>>>;
async function readOwnedProgress(access: Access): Promise<LessonProgressResult> {
  const { reader, userId, lessonUuid, versionUuid, lesson } = access;
  // RLS plus explicit owner filters; privileged clients never read learner progress for the UI.
  const result = await reader.from("lesson_progress")
    .select("user_id,lesson_id,lesson_version_id,status,resume_section")
    .eq("user_id", userId).eq("lesson_id", lessonUuid).maybeSingle();
  if (result.error) throw new Error("Progress read failed");
  if (!result.data) return { status: "ready", progress: null };
  const row = recordSchema.parse(result.data);
  if (row.user_id !== userId || row.lesson_id !== lessonUuid || row.lesson_version_id !== versionUuid || row.resume_section >= lesson.sections.length) throw new Error("Unexpected lesson progress");
  return { status: "ready", progress: { status: row.status, resumeSection: row.resume_section } };
}

export async function getLessonProgress(lessonId: unknown): Promise<LessonProgressResult> {
  try {
    const access = await accessLesson(lessonId, true);
    return access ? await readOwnedProgress(access) : { status: "error", message: "Sign in again to load your lesson progress." };
  } catch { return failure(); }
}

export async function saveLessonProgress(input: unknown, ip: string): Promise<LessonProgressResult> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "Invalid lesson progress request." };
  const { lessonId, operation, section } = parsed.data;
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson || (operation === "resume" ? section === undefined || section >= lesson.sections.length : section !== undefined)) return { status: "error", message: "Choose a valid lesson and reading section." };
  try {
    const access = await accessLesson(lessonId, false);
    if (!access) return { status: "error", message: "Sign in again before saving lesson progress." };
    const { writer, userId, lessonUuid, versionUuid } = access;
    if (!allowProgressAttempt(`${userId}:${lessonId}`, ip)) return { status: "error", message: "Too many progress updates. Please wait a few minutes and try again." };
    // Bootstrap only this verified user's missing profile; preserve preferences and Auth names.
    const profile = await writer.from("profiles").upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });
    if (profile.error) throw new Error("Profile bootstrap failed");
    const start = await writer.from("lesson_progress").upsert({
      user_id: userId, lesson_id: lessonUuid, lesson_version_id: versionUuid,
    }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
    if (start.error) throw new Error("Lesson start failed");
    if (operation !== "start") {
      const change = operation === "complete"
        ? { status: "completed", completed_at: new Date().toISOString(), resume_section: lesson.sections.length - 1 }
        : { resume_section: section! };
      // Atomic database filter: stale bookmarks cannot reopen completion; retries keep its date.
      const update = await writer.from("lesson_progress").update(change)
        .eq("user_id", userId).eq("lesson_id", lessonUuid).eq("lesson_version_id", versionUuid).eq("status", "started");
      if (update.error) throw new Error("Progress update failed");
    }
    const saved = await readOwnedProgress(access);
    if (saved.status !== "ready" || !saved.progress || (operation === "complete" && saved.progress.status !== "completed")) throw new Error("Unconfirmed progress write");
    // A no-op write or competing bookmark must not be presented as saving this position.
    // Completion is terminal and legitimately takes precedence over a stale bookmark.
    if (operation === "resume" && saved.progress.status === "started" && saved.progress.resumeSection !== section) throw new Error("Unconfirmed bookmark write");
    return saved;
  } catch { return failure(); }
}
