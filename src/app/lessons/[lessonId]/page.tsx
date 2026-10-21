import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Clock3, ExternalLink, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuizQuestion } from "@/components/learning/quiz-question";
import { lessons } from "@/data/mock/lessons";
import { topics } from "@/data/mock/curriculum";
import { questions } from "@/data/mock/questions";
import { LessonCompletion } from "@/features/curriculum/lesson-completion";

export function generateStaticParams() {
  return lessons.map((lesson) => ({ lessonId: lesson.id }));
}

// The content is server-rendered. Only the knowledge check and completion control use client state.
export default async function LessonPage({ params }: { params: Promise<{ lessonId: string; }>; }) {
  const { lessonId } = await params;
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) notFound();
  const topic = topics.find((item) => item.id === lesson.topicId)!;
  const topicLessons = lessons.filter((item) => item.topicId === topic.id);
  const lessonIndex = topicLessons.findIndex((item) => item.id === lesson.id);
  const previous = topicLessons[lessonIndex - 1];
  const next = topicLessons[lessonIndex + 1];
  const check = questions.find((question) => question.id === lesson.checkQuestionId)!;

  return <div className="mx-auto max-w-5xl">
    <Link className="section-link mt-6" href={`/learn/${topic.id}`}><ArrowLeft size={14} />{topic.name} lessons</Link>
    <div className="my-7">
      <p className="eyebrow">{topic.name} / LESSON {lessonIndex + 1} OF {topicLessons.length}</p>
      <h1>{lesson.title}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{lesson.minutes} min read</span>
        <span className="inline-flex items-center gap-1.5"><BookOpen size={14} />Educational sample</span>
      </div>
    </div>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_240px]">
      <article className="min-w-0 space-y-6">
        <Card className="p-5 sm:p-7">
          <h2 className="section-title mb-4">What you will learn</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground">
            {lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}
          </ul>
        </Card>
        {lesson.sections.map((section, index) => <section id={`section-${index}`} key={section.title} className="scroll-mt-6">
          <h2 className="mb-3 text-xl font-semibold tracking-tight">{section.title}</h2>
          <p className="text-sm leading-8 text-muted-foreground">{section.body}</p>
          {section.code && <pre className="code-block mt-4"><code>{section.code}</code></pre>}
        </section>)}
        <div className="callout">
          <h2 className="mb-2 flex items-center gap-2 font-semibold"><Lightbulb size={17} className="text-primary" />The key idea</h2>
          {lesson.takeaway}
        </div>
        <Card className="p-5 sm:p-7">
          <h2 className="section-title mb-5">Check your understanding</h2>
          <QuizQuestion key={check.id} question={check} />
        </Card>
        <LessonCompletion key={lesson.id} />
        <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-6">
          {previous ? <Button asChild variant="outline"><Link href={`/lessons/${previous.id}`}><ArrowLeft />Previous lesson</Link></Button> : <Button asChild variant="outline"><Link href={`/learn/${topic.id}`}><ArrowLeft />Topic overview</Link></Button>}
          {next ? <Button asChild><Link href={`/lessons/${next.id}`}>Next lesson <ArrowRight /></Link></Button> : <Button asChild><Link href={`/practice?topic=${topic.id}`}>Practice {topic.name} <ArrowRight /></Link></Button>}
        </div>
      </article>
      <aside className="space-y-5 xl:sticky xl:top-6">
        <Card className="p-5">
          <h2 className="eyebrow">IN THIS LESSON</h2>
          <nav aria-label="Lesson sections" className="mt-3 space-y-3">
            {lesson.sections.map((section, index) => <a key={section.title} href={`#section-${index}`} className="block text-xs leading-6 text-muted-foreground hover:text-primary">
              {String(index + 1).padStart(2, "0")} · {section.title}
            </a>)}
          </nav>
        </Card>
        <div className="px-1">
          <h2 className="eyebrow">KEEP EXPLORING</h2>
          <a
            className="inline-flex items-start gap-2 text-xs leading-6 text-primary underline-offset-4 hover:underline"
            href={lesson.reference.url}
            target="_blank"
            rel="noreferrer">
            {lesson.reference.title}
            <ExternalLink size={13} className="mt-1 shrink-0" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <p className="mt-4 text-xs leading-6 text-muted-foreground">Examples are for reading and discussion. Code is not executed in this frontend.</p>
        </div>
      </aside>
    </div>
  </div>;
}
