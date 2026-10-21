import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Clock3 } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { topics } from "@/data/mock/curriculum";
import { lessons } from "@/data/mock/lessons";
import { questions } from "@/data/mock/questions";
import { topicProgress } from "@/data/mock/progress";

export function generateStaticParams() {
  return topics.map((topic) => ({ topicSlug: topic.id }));
}

export default async function TopicPage({ params }: { params: Promise<{ topicSlug: string; }>; }) {
  const { topicSlug } = await params;
  const topic = topics.find((item) => item.id === topicSlug);
  if (!topic) notFound();
  const availableLessons = lessons.filter((lesson) => lesson.topicId === topic.id);
  const progress = topicProgress.find((row) => row.topicId === topic.id);
  const hasPractice = questions.some((question) => question.topicId === topic.id);

  return (
    <>
      <Link className="section-link mt-6" href="/learn"><ArrowLeft size={14} />All study topics</Link>
      <PageHeading
        eyebrow={`${topic.category} / ${topic.difficulty}`}
        title={topic.name}
        description={topic.description}
        action={hasPractice ? <Button asChild><Link href={`/practice?topic=${topic.id}`}>Practice this topic <ArrowRight /></Link></Button> : undefined} />
      <Card className="mb-6 p-5">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Illustrative topic completion</span>
          <span className="font-semibold">{progress?.completion ?? 0}%</span>
        </div>
        <Progress label={`${topic.name} sample completion`} value={progress?.completion ?? 0} />
        <p className="mt-3 text-xs text-muted-foreground">This sample indicator is independent of the lessons you open or answers you submit.</p>
      </Card>
      <h2 className="section-title mb-4">Available sample lessons</h2>
      {availableLessons.length ? <ol className="space-y-3">
        {availableLessons.map((lesson, index) => <li key={lesson.id}>
          <Link href={`/lessons/${lesson.id}`} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{lesson.title}</span>
              <span className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Clock3 size={12} />{lesson.minutes} min</span>
                <span className="inline-flex items-center gap-1"><BookOpen size={12} />{lesson.objectives.length} learning objectives</span>
              </span>
            </span>
            <ArrowRight size={18} className="shrink-0 text-primary" />
          </Link>
        </li>)}
      </ol> : <Card className="p-8">
        <h3 className="font-semibold">Lessons are still being developed</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">This category is part of the planned curriculum. There are no sample lessons here yet. You can explore the conceptual practice question or return to the topic library.</p>
        <Button variant="outline" className="mt-5" asChild>
          <Link href={`/practice?topic=${topic.id}`}>Open sample practice <ArrowRight /></Link>
        </Button>
      </Card>}
    </>
  );
}
