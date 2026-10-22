import type { Metadata } from "next";
import { TopicLibrary } from "@/features/curriculum/topic-library";
import { getStudyProgress } from "@/server/learning/study-progress";

export const metadata: Metadata = { title: "Study Topics" };

// Next.js route query parameters are asynchronous. Validate the selected ID in the feature.
export default async function LearnPage({ searchParams }: { searchParams: Promise<{ path?: string; }>; }) {
  const { path } = await searchParams;
  const progress = await getStudyProgress();
  return <TopicLibrary key={path ?? "all"} initialPath={path} progress={progress.status === "ready" ? progress.data.topics : []} progressError={progress.status === "error" ? progress.message : undefined} />;
}
