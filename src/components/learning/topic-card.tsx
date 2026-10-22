import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { lessons } from "@/data/mock/lessons";
import type { TopicStudyProgress } from "@/features/progress/types";
import type { Topic } from "@/features/curriculum/types";

// Counts come from actual sample lessons, not aspirational curriculum totals.
export function TopicCard({ topic, progress }: { topic: Topic; progress?: TopicStudyProgress }) {
  const lessonCount = lessons.filter((lesson) => lesson.topicId === topic.id).length;
  const completion = progress?.lessonCount ? Math.round(progress.completed / progress.lessonCount * 100) : 0;
  return (
    <Link href={`/learn/${topic.id}`} className="group block rounded-lg">
      <Card className="topic-card h-full transition-colors group-hover:bg-muted">
        <span className="topic-symbol" aria-hidden="true">{topic.symbol}</span>
        <div className="min-w-0">
          <p className="mb-1 text-xs text-muted-foreground">{topic.category} · {topic.difficulty}</p>
          <h2 className="text-base font-semibold">{topic.name}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{topic.description}</p>
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen size={14} aria-hidden="true" />{lessonCount} sample {lessonCount === 1 ? "lesson" : "lessons"}
          </p>
          {progress ? <div className="topic-card-progress">
            <div className="mb-2 flex justify-between gap-4 text-xs">
              <span className="text-muted-foreground">Lesson completion</span>
              <span className="font-medium tabular-nums">{completion}%</span>
            </div>
            <Progress value={completion} label={`${topic.name} lesson completion`} />
          </div> : <p className="mt-2 text-xs text-muted-foreground">Progress unavailable</p>}
        </div>
        <ArrowUpRight size={16} className="mt-1 text-muted-foreground group-hover:text-primary" aria-hidden="true" />
      </Card>
    </Link>
  );
}
