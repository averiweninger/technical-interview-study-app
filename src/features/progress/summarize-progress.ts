import { lessons } from "@/data/mock/lessons";
import { topics } from "@/data/mock/curriculum";
import type { Activity, StudySnapshot } from "./types";
import { getCareerPath } from "@/features/curriculum/career-path-selection";

export type LessonRecord = { slug: string; status: "started" | "completed"; resumeSection: number; updatedAt: string };
export type AttemptRecord = { id: string; topicId: string | null; title: string; state: "graded" | "submitted"; score: number | null; at: string };

/** Descriptive records only: no inferred mastery, time spent, streak, or scheduled reviews. */
export function summarizeProgress(records: LessonRecord[], attempts: AttemptRecord[], now = new Date(), pathId?: string): StudySnapshot {
  const known = records.filter((row) => lessons.some((lesson) => lesson.id === row.slug));
  const lessonStates = Object.fromEntries(known.map((row) => [row.slug, { status: row.status, resumeSection: row.resumeSection }]));
  const graded = attempts.filter((row) => row.state === "graded");
  const accuracy = (rows: AttemptRecord[]) => rows.length ? Math.round(rows.reduce((sum, row) => sum + (row.score ?? 0), 0) / rows.length * 100) : null;
  // Path order determines the next subject; progress and history remain shared across paths.
  const available = pathId ? getCareerPath(pathId).topicIds.flatMap((id) => lessons.filter((lesson) => lesson.topicId === id)) : lessons;
  const unfinished = [...known].filter((row) => row.status === "started" && available.some((lesson) => lesson.id === row.slug)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const next = unfinished ? available.find((lesson) => lesson.id === unfinished.slug) : available.find((lesson) => lessonStates[lesson.id]?.status !== "completed");
  const activity: Activity[] = [
    ...known.map((row) => ({ id: `lesson:${row.slug}`, title: lessons.find((lesson) => lesson.id === row.slug)!.title,
      detail: row.status === "completed" ? "Lesson completed" : "Lesson in progress", href: `/lessons/${row.slug}`, at: row.updatedAt })),
    ...attempts.map((row) => ({ id: row.id, title: row.title, detail: row.state === "graded" ? `Practice score: ${Math.round((row.score ?? 0) * 100)}%` : "Self-review draft saved · ungraded", href: row.topicId ? `/practice?topic=${row.topicId}` : "/practice", at: row.at })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(end.getTime() - (6 - index) * 86_400_000);
    const day = date.toISOString().slice(0, 10);
    return { day, label: date.toLocaleDateString("en", { weekday: "short", timeZone: "UTC" }), count: attempts.filter((row) => row.at.slice(0, 10) === day).length };
  });
  return {
    completedLessons: known.filter((row) => row.status === "completed").length, totalLessons: lessons.length,
    gradedAttempts: graded.length, selfReviews: attempts.filter((row) => row.state === "submitted").length, accuracy: accuracy(graded),
    continueLesson: next ? { id: next.id, title: next.title, section: unfinished?.resumeSection ?? 0, reason: unfinished ? "Your most recently saved unfinished lesson" : pathId ? "Next unfinished lesson in your selected career path" : "Next unfinished lesson in the available library" } : null,
    lessonStates, activity, days,
    topics: topics.map((topic) => {
      const topicLessons = lessons.filter((lesson) => lesson.topicId === topic.id);
      const topicAttempts = graded.filter((row) => row.topicId === topic.id);
      return { topicId: topic.id, completed: topicLessons.filter((lesson) => lessonStates[lesson.id]?.status === "completed").length, lessonCount: topicLessons.length, answered: topicAttempts.length, accuracy: accuracy(topicAttempts) };
    }),
  };
}
