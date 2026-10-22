"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnswerFeedback } from "./answer-feedback";
import { practiceAction } from "@/features/practice/actions";
import type { PracticeResult, PublicPracticeQuestion } from "@/features/practice/types";

export function QuizQuestion({ question, accountId, context = "practice", onGrade }: {
  question: PublicPracticeQuestion; accountId: string; context?: string; onGrade?: (id: string, correct: boolean) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<PracticeResult>({ status: "empty" });
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [revealed, setRevealed] = useState(true);
  const submissionKey = useRef<string | null>(null);
  const busy = useRef(false);
  const isChoice = question.kind === "multiple-choice";
  const saved = result.status === "saved";

  useEffect(() => {
    let active = true;
    async function restore() {
      const storageKey = "ic:practice:" + accountId + ":" + context + ":" + question.id;
      let previous: string | null = null;
      try { previous = sessionStorage.getItem(storageKey); } catch { /* Memory-only retries still work when storage is blocked. */ }
      submissionKey.current = previous ?? crypto.randomUUID();
      try { sessionStorage.setItem(storageKey, submissionKey.current); } catch { /* No draft, token, or feedback is stored here. */ }
      const loaded: PracticeResult = previous ? await practiceAction("load", { questionId: question.id, submissionKey: previous }) : await Promise.resolve({ status: "empty" });
      if (!active) return;
      setResult(loaded);
      if (loaded.status === "saved") setAnswer(loaded.kind === "graded" ? loaded.selectedId : loaded.draft);
      setLoading(false);
    }
    void restore().catch(() => { if (active) { setResult({ status: "error", message: "Your saved answer could not be loaded. Please retry." }); setLoading(false); } });
    return () => { active = false; };
  }, [accountId, context, question.id]);

  function run(mode: "load" | "submit") {
    if (busy.current || !submissionKey.current) return;
    busy.current = true;
    startTransition(async () => {
      try {
        const next = await practiceAction(mode, { questionId: question.id, submissionKey: submissionKey.current, ...(mode === "submit" ? { answer } : {}) });
        setResult(next);
        if (next.status === "saved") {
          setAnswer(next.kind === "graded" ? next.selectedId : next.draft);
          if (mode === "submit" && next.kind === "graded") onGrade?.(question.id, next.isCorrect);
        }
      } catch { setResult({ status: "error", message: "Your answer could not be saved. Retry the same answer." }); }
      finally { busy.current = false; }
    });
  }
  function submit(event: FormEvent) { event.preventDefault(); if (!saved && !loading) run("submit"); }
  function freshAttempt() {
    if (busy.current || loading) return;
    const key = crypto.randomUUID();
    submissionKey.current = key;
    try { sessionStorage.setItem("ic:practice:" + accountId + ":" + context + ":" + question.id, key); } catch { /* In-memory retry key remains available. */ }
    setAnswer(""); setResult({ status: "empty" }); setRevealed(true);
  }

  return <div aria-busy={loading || pending}>
    <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
      <span>{question.difficulty}</span><span aria-hidden="true">{"\u00b7"}</span>
      <span>{isChoice ? "Multiple choice" : question.kind === "coding" ? "Display-only exercise" : "Self-review"}</span>
    </div>
    <h3 className="mb-6 text-lg leading-8 font-semibold tracking-tight">{question.prompt}</h3>
    {loading && <p role="status" className="mb-3 text-sm text-muted-foreground">Loading saved answer...</p>}
    <form onSubmit={submit}>
      {question.kind === "multiple-choice" ? <fieldset disabled={saved || loading || pending} className="space-y-3">
        <legend className="mb-4 text-sm text-muted-foreground">Choose one answer.</legend>
        {question.options.map((option, index) => <label key={option.id} className="quiz-option cursor-pointer">
          <input type="radio" className="size-4 shrink-0 accent-primary" name={"answer-" + question.id} value={option.id} checked={answer === option.id} onChange={() => setAnswer(option.id)} required />
          <span className="text-xs font-semibold text-muted-foreground">{String.fromCharCode(65 + index)}.</span><span>{option.text}</span>
          {result.status === "saved" && result.kind === "graded" && option.id === result.correctOptionId && <Check size={16} className="ml-auto shrink-0 text-primary" aria-label="Correct answer" />}
        </label>)}
      </fieldset> : <>
        {question.kind === "coding" && <><p className="callout mb-4">Display-only {question.language} exercise. Drafts are saved for self-review; code is never executed or automatically graded.</p><pre className="code-block mb-4"><code>{question.example}</code></pre></>}
        <label className="field-label" htmlFor={"draft-" + question.id}>{question.kind === "coding" ? "Your solution draft (optional)" : "Your explanation"}</label>
        <textarea id={"draft-" + question.id} className="field min-h-36 resize-y" value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={8000} disabled={saved || loading || pending} spellCheck={question.kind !== "coding"} />
        <p className="mt-2 text-xs text-muted-foreground">Revealing the reference answer saves this draft to your account. Self-review has no automatic score.</p>
      </>}
      {!saved && <Button type="submit" variant={isChoice ? "default" : "outline"} className="mt-5" disabled={loading || pending || (isChoice && !answer)}>
        {!isChoice && <Eye />}{pending ? "Saving answer..." : isChoice ? "Check answer" : question.kind === "coding" ? "Reveal example solution" : "Reveal model answer"}
      </Button>}
    </form>
    {result.status === "error" && <div className="mt-3"><p role="alert" className="text-sm text-destructive">{result.message}</p><Button className="mt-2" variant="outline" disabled={pending} onClick={() => run("load")}>Reload saved answer</Button></div>}
    {result.status === "saved" && result.kind === "graded" && <AnswerFeedback correct={result.isCorrect} title={result.isCorrect ? "Correct. Nicely reasoned." : "Not quite. Here is the reasoning."}>
      {!result.isCorrect && question.kind === "multiple-choice" && <p className="mb-2 font-medium text-foreground">Correct answer: {question.options.find((option) => option.id === result.correctOptionId)?.text}</p>}
      {result.explanation}<p className="mt-2 text-xs">Saved to your practice history. This sample exercise does not establish mastery.</p>
    </AnswerFeedback>}
    {(saved || result.status === "error") && <Button className="mt-3" variant="outline" disabled={pending} onClick={freshAttempt}>Try a new attempt</Button>}
    {result.status === "saved" && result.kind === "self-review" && <>
      <Button className="mt-3" variant="outline" onClick={() => setRevealed(!revealed)} aria-expanded={revealed}>{revealed ? "Hide" : "Show"} reference answer</Button>
      {revealed && <AnswerFeedback title={question.kind === "coding" ? "Example solution \u00b7 not executed" : "Model answer \u00b7 self-review"}><pre className="code-block mb-4 whitespace-pre-wrap"><code>{result.solution}</code></pre>{result.explanation}<p className="mt-2 text-xs">Draft saved. No score or mastery evidence was generated.</p></AnswerFeedback>}
    </>}
  </div>;
}
