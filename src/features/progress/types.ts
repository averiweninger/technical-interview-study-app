export type Activity = { id: string; title: string; detail: string; href: string; at: string };
export type TopicStudyProgress = { topicId: string; completed: number; lessonCount: number; answered: number; accuracy: number | null };
export type StudySnapshot = {
  completedLessons: number; totalLessons: number; gradedAttempts: number; selfReviews: number; accuracy: number | null;
  continueLesson: { id: string; title: string; section: number; reason: string } | null;
  lessonStates: Record<string, { status: "started" | "completed"; resumeSection: number }>;
  topics: TopicStudyProgress[]; activity: Activity[]; days: { day: string; count: number; label: string }[];
};
export type StudyProgressResult = { status: "ready"; data: StudySnapshot } | { status: "error"; message: string };
