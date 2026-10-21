import { CheckCircle2, CircleHelp } from "lucide-react";
import type { ReactNode } from "react";

export function AnswerFeedback({ correct, title, children }: { correct?: boolean; title: string; children: ReactNode; }) {
  const tone = correct === true ? "feedback-correct" : correct === false ? "feedback-review" : "";
  return <div className={`feedback mt-6 ${tone}`} role="status">
    <div className="mb-2 flex items-center gap-2 font-semibold">
      {correct ? <CheckCircle2 size={18} aria-hidden="true" /> : <CircleHelp size={18} aria-hidden="true" />}
      {title}
    </div>
    <div className="text-sm leading-7 text-muted-foreground">{children}</div>
  </div>;
}
