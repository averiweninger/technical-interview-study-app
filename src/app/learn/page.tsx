import type { Metadata } from "next";
import { TopicLibrary } from "@/features/curriculum/topic-library";

export const metadata: Metadata = { title: "Study Topics" };

// Next.js route query parameters are asynchronous. Validate the selected ID in the feature.
export default async function LearnPage({ searchParams }: { searchParams: Promise<{ path?: string; }>; }) {
  const { path } = await searchParams;
  return <TopicLibrary key={path ?? "all"} initialPath={path} />;
}
