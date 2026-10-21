import type { Metadata } from "next";
import { PracticeWorkspace } from "@/features/practice/practice-workspace";

export const metadata: Metadata = { title: "Practice" };

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ topic?: string; }>; }) {
  const { topic } = await searchParams;
  return <PracticeWorkspace key={topic ?? "all"} initialTopic={topic} />;
}
