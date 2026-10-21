import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { lessons } from "@/data/mock/lessons";
import { topicProgress } from "@/data/mock/progress";
import type { Topic } from "@/features/curriculum/types";

// Counts come from actual sample lessons, not aspirational curriculum totals.
export function TopicCard({ topic }: { topic: Topic; }) {
  const lessonCount = lessons.filter((lesson) => lesson.topicId === topic.id).length;
  const completion = topicProgress.find((row) => row.topicId === topic.id)?.completion ?? 0;
  return (
    <Link href={`/learn/${topic.id}`} className="group block rounded-xl">
      <Card className="topic-card h-full transition-colors group-hover:border-primary/50">
        <div className="flex items-start justify-between gap-3">
          <span className={`topic-symbol accent-${topic.accent}`}>{topic.symbol}</span>
          <ArrowUpRight size={18} className="text-muted-foreground group-hover:text-primary" />
        </div>
        <span className="mt-5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{topic.category}</span>
        <h2 className="mt-2 text-lg font-semibold tracking-tight">{topic.name}</h2>
        <p className="mt-2 min-h-15 text-sm leading-6 text-muted-foreground">{topic.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen size={14} />
            {lessonCount} sample {lessonCount === 1 ? "lesson" : "lessons"}
          </span>
          <span>{topic.difficulty}</span>
        </div>
        <div className="mt-6 border-t border-border pt-4">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-muted-foreground">Sample completion</span>
            <span className="font-semibold">{completion}%</span>
          </div>
          <Progress value={completion} label={`${topic.name} sample completion`} />
        </div>
      </Card>
    </Link>
  );
}
