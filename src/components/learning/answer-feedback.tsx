import { CheckCircle2, CircleHelp } from "lucide-react";
import type { ReactNode } from "react";

export function AnswerFeedback({ correct, title, children }: { correct?: boolean; title: string; children: ReactNode; }) {
  return <div className={`feedback mt-5 ${correct ? "feedback-correct" : ""}`} role="status">
    <div className="mb-2 flex items-center gap-2 font-semibold">
      {correct ? <CheckCircle2 size={18} className="text-primary" /> : <CircleHelp size={18} className="text-primary" />}
      {title}
    </div>
    <div className="text-sm leading-7 text-muted-foreground">{children}</div>
  </div>;
}
