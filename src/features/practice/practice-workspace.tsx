"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuizQuestion } from "@/components/learning/quiz-question";
import { topics } from "@/data/mock/curriculum";
import { questions } from "@/data/mock/questions";

export function PracticeWorkspace({ initialTopic }: { initialTopic?: string; }) {
  const [topicId, setTopicId] = useState(topics.some((topic) => topic.id === initialTopic) ? initialTopic! : "all");
  const [kind, setKind] = useState("all");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [restartCount, setRestartCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const filtered = questions.filter((question) => (topicId === "all" || question.topicId === topicId) && (kind === "all" || question.kind === kind));
  const question = filtered[index];
  const graded = Object.values(answers);
  const correct = graded.filter(Boolean).length;

  function changeFilter(filter: "topic" | "kind", value: string) {
    if (filter === "topic") setTopicId(value);
    else setKind(value);
    setIndex(0);
    setFinished(false);
  }

  // Keying answers by question prevents revisits from inflating the session total.
  function recordGrade(id: string, isCorrect: boolean) {
    setAnswers((current) => ({ ...current, [id]: isCorrect }));
  }

  function restartPractice() {
    setIndex(0);
    setFinished(false);
    setAnswers({});
    setRestartCount((count) => count + 1);
  }

  return <>
    <PageHeading
      eyebrow="PUT YOUR KNOWLEDGE TO WORK"
      title="Practice with purpose."
      description="Try a question, explain your thinking, and learn from the feedback. No timer. No pressure." />
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0">
        <Card className="mb-4 grid gap-4 p-4 sm:grid-cols-2">
          <div>
            <label htmlFor="practice-topic" className="field-label">Topic</label>
            <select id="practice-topic" className="field" value={topicId} onChange={(event) => changeFilter("topic", event.target.value)}>
              <option value="all">All topics</option>
              {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="practice-kind" className="field-label">Question format</label>
            <select id="practice-kind" className="field" value={kind} onChange={(event) => changeFilter("kind", event.target.value)}>
              <option value="all">All formats</option>
              <option value="multiple-choice">Multiple choice</option>
              <option value="short-answer">Conceptual self-review</option>
              <option value="coding">Display-only coding exercises</option>
            </select>
          </div>
        </Card>
        {!question ? <Card className="p-8">
          <h2 className="text-lg font-semibold">No questions in this combination</h2>
          <p className="my-3 text-sm leading-6 text-muted-foreground">This sample bank is small. Try all formats or choose another topic.</p>
          <Button variant="outline" onClick={() => { setTopicId("all"); setKind("all"); setIndex(0); setFinished(false); }}>Show all questions</Button>
        </Card> : finished ? <Card className="p-8">
          <p className="eyebrow">END OF THIS QUESTION SET</p>
          <h2 className="text-2xl font-semibold">A little more understanding.</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">You reached the end of these {filtered.length} sample questions. Browsing a question does not count as answering it.</p>
          <p className="mt-4 text-sm">This visit: <strong>{graded.length}</strong> multiple-choice questions answered, <strong>{correct}</strong> correct. Self-review and code drafts are ungraded.</p>
          <Button className="mt-6" onClick={restartPractice}><RotateCcw />Start a fresh practice</Button>
        </Card> : <Card className="p-5 sm:p-7">
          <div className="mb-4 flex justify-between gap-3 text-xs text-muted-foreground">
            <span>{topics.find((topic) => topic.id === question.topicId)?.name}</span>
            <span>Question {index + 1} of {filtered.length}</span>
          </div>
          <Progress value={(index + 1) / filtered.length * 100} label="Position in sample question set" className="mb-6" />
          <QuizQuestion key={`${question.id}-${restartCount}`} question={question} onGrade={recordGrade} />
          <div className="mt-7 flex justify-between gap-3 border-t border-border pt-5">
            <Button variant="outline" disabled={index === 0} onClick={() => setIndex((current) => current - 1)}><ArrowLeft />Previous</Button>
            <Button onClick={() => index + 1 < filtered.length ? setIndex((current) => current + 1) : setFinished(true)}>
              {index + 1 < filtered.length ? "Next question" : "Finish set"}
              <ArrowRight />
            </Button>
          </div>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">You can skip questions. Leaving a question clears its draft; returning starts a fresh form.</p>
        </Card>}
      </div>
      <aside className="space-y-5">
        <Card className="p-5">
          <h2 className="section-title">This practice visit</h2>
          <p className="section-caption">Temporary multiple-choice results.</p>
          <div role="status" className="mt-5 grid grid-cols-2 gap-3">
            <div><p className="text-2xl font-semibold">{graded.length}</p><p className="mt-1 text-xs text-muted-foreground">Answered</p></div>
            <div>
              <p className="text-2xl font-semibold">{graded.length ? `${Math.round(correct / graded.length * 100)}%` : "—"}</p>
              <p className="mt-1 text-xs text-muted-foreground">Accuracy</p>
            </div>
          </div>
          <Button className="mt-5 w-full" variant="outline" onClick={restartPractice}><RotateCcw />Reset this visit</Button>
        </Card>
        <div className="callout">
          <h2 className="mb-2 font-semibold">Learning, not assessment</h2>
          <p>Answers are public demo content. Self-review and coding exercises are ungraded. Your practice does not update the sample progress page.</p>
          <Link className="section-link mt-4" href="/learn">Revisit a lesson <ArrowRight size={14} /></Link>
        </div>
      </aside>
    </div>
  </>;
}
