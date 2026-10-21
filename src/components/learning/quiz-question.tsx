"use client";

import { useState, type FormEvent } from "react";
import { Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnswerFeedback } from "@/components/learning/answer-feedback";
import { gradeAnswer, type GradeResult } from "@/features/practice/grade-answer";
import type { MultipleChoiceQuestion, PracticeQuestion } from "@/features/practice/types";

type QuizProps = { question: PracticeQuestion; onGrade?: (id: string, correct: boolean) => void; };

function MultipleChoiceAnswer({ question, onGrade }: { question: MultipleChoiceQuestion; } & Pick<QuizProps, "onGrade">) {
  const [selectedId, setSelectedId] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const submitted = result?.status === "graded";

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted) return;
    const nextResult = gradeAnswer(question, selectedId);
    setResult(nextResult);
    if (nextResult.status === "graded") onGrade?.(question.id, nextResult.isCorrect);
  }

  return <form onSubmit={submitAnswer}>
    <fieldset disabled={submitted} className="space-y-3">
      <legend className="mb-4 text-sm text-muted-foreground">Choose one answer.</legend>
      {question.options.map((option, index) => <label key={option.id} className="quiz-option cursor-pointer">
        <input
          type="radio"
          className="size-4 shrink-0 accent-primary"
          name={`answer-${question.id}`}
          value={option.id}
          checked={selectedId === option.id}
          onChange={() => setSelectedId(option.id)}
          required />
        <span className="text-xs font-semibold text-muted-foreground">{String.fromCharCode(65 + index)}.</span>
        <span>{option.text}</span>
        {submitted && option.id === question.correctOptionId && <Check size={16} className="ml-auto shrink-0 text-primary" aria-label="Correct answer" />}
      </label>)}
    </fieldset>
    {!submitted && <Button type="submit" className="mt-5" disabled={!selectedId}>Check answer</Button>}
    {result?.status === "invalid" && <p role="alert" className="mt-3 text-sm">{result.message}</p>}
    {result?.status === "graded" && <AnswerFeedback correct={result.isCorrect} title={result.isCorrect ? "Correct. Nicely reasoned." : "Not quite. Here is the reasoning."}>
      {!result.isCorrect && <p className="mb-2 font-medium text-foreground">Correct answer: {question.options.find((option) => option.id === question.correctOptionId)?.text}
      </p>}
      {result.explanation}
      <p className="mt-2 text-xs">Demo feedback only. This answer does not change the sample dashboard or mastery.</p>
    </AnswerFeedback>}
  </form>;
}

function SelfReviewAnswer({ question }: { question: Exclude<PracticeQuestion, MultipleChoiceQuestion>; }) {
  const [draft, setDraft] = useState("");
  const [revealed, setRevealed] = useState(false);
  const isCoding = question.kind === "coding";

  return <div>
    {isCoding && <>
      <p className="callout mb-4">Display-only {question.language} exercise. You can draft a solution here, but it will not be executed or automatically graded.</p>
      <pre className="code-block mb-4"><code>{question.example}</code></pre>
    </>}
    <label className="field-label" htmlFor={`draft-${question.id}`}>{isCoding ? "Your solution draft (optional)" : "Your explanation"}</label>
    <textarea
      id={`draft-${question.id}`}
      className={`field min-h-36 resize-y ${isCoding ? "font-mono" : ""}`}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      placeholder={isCoding ? "Sketch your approach..." : "Explain the concept in your own words..."}
      maxLength={8000}
      spellCheck={!isCoding} />
    <p className="mt-2 text-xs text-muted-foreground">Your draft stays on this question only. It is never sent to a server.</p>
    <Button
      className="mt-5"
      type="button"
      variant="outline"
      onClick={() => setRevealed(!revealed)}
      aria-expanded={revealed}
      aria-controls={`solution-${question.id}`}>
      <Eye />
      {revealed ? "Hide" : "Reveal"} {isCoding ? "example solution" : "model answer"}
    </Button>
    {revealed && <div id={`solution-${question.id}`}>
      <AnswerFeedback title={isCoding ? "Example solution · not executed" : "Model answer · self-review"}>
        {isCoding ? <pre className="code-block mb-4"><code>{question.solution}</code></pre> : <p className="mb-3 text-foreground">{question.modelAnswer}</p>}
        {question.explanation}
      </AnswerFeedback>
    </div>}
  </div>;
}

// Parent components set a question-specific key, giving each new question a fresh answer form.
export function QuizQuestion({ question, onGrade }: QuizProps) {
  return <div>
    <div className="mb-4 flex flex-wrap gap-2">
      <span className="pill">{question.difficulty}</span>
      <span className="pill">
        {question.kind === "multiple-choice" ? "Multiple choice" : question.kind === "short-answer" ? "Self-review" : "Display-only exercise"}
      </span>
    </div>
    <h3 className="mb-6 text-lg leading-8 font-semibold tracking-tight">{question.prompt}</h3>
    {question.kind === "multiple-choice" ? <MultipleChoiceAnswer question={question} onGrade={onGrade} /> : <SelfReviewAnswer question={question} />}
  </div>;
}
