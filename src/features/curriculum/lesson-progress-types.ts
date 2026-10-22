export type LessonProgress = { status: "started" | "completed"; resumeSection: number };
export type LessonProgressResult =
  | { status: "ready"; progress: LessonProgress | null }
  | { status: "error"; message: string };
