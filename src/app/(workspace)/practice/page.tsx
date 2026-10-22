import type { Metadata } from "next";
import { PracticeWorkspace } from "@/features/practice/practice-workspace";
import { publicQuestions } from "@/server/learning/question-bank";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Practice" };

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ topic?: string; }>; }) {
  const { topic } = await searchParams;
  const actor = await requireUser();
  return <PracticeWorkspace key={topic ?? "all"} initialTopic={topic} questions={publicQuestions()} accountId={actor.id} />;
}
