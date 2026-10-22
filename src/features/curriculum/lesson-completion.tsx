"use client";

import { createContext, useContext, useRef, useState, useTransition, type ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { reloadLessonProgress, updateLessonProgress } from "./lesson-progress-actions";
import type { LessonProgressResult } from "./lesson-progress-types";

type ProgressContext = {
  state: LessonProgressResult;
  pending: boolean;
  save: (operation: "start" | "resume" | "complete", section?: number) => void;
  retry: () => void;
};
const Context = createContext<ProgressContext | null>(null);
function useLessonProgress() {
  const context = useContext(Context);
  if (!context) throw new Error("Lesson progress provider required");
  return context;
}

/** One request state connects the reading bookmark to the existing completion footer. */
export function LessonProgressProvider({ lessonId, initial, children }: { lessonId: string; initial: LessonProgressResult; children: ReactNode }) {
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);
  function run(request: () => Promise<LessonProgressResult>) {
    if (busy.current) return;
    busy.current = true;
    startTransition(async () => {
      try { setState(await request()); }
      catch { setState({ status: "error", message: "Progress could not be saved. Check your connection and try again." }); }
      finally { busy.current = false; }
    });
  }
  return <Context.Provider value={{ state, pending, save: (operation, section) => run(() => updateLessonProgress({ lessonId, operation, ...(section === undefined ? {} : { section }) })), retry: () => run(() => reloadLessonProgress(lessonId)) }}>{children}</Context.Provider>;
}

export function LessonProgressControls({ sections }: { sections: string[] }) {
  const { state, pending, save, retry } = useLessonProgress();
  const progress = state.status === "ready" ? state.progress : null;
  const [section, setSection] = useState<number | null>(null);
  const selectedSection = section ?? progress?.resumeSection ?? 0;
  return <Card className="p-4" aria-busy={pending}>
    <h2 className="section-title">Lesson progress</h2>
    {state.status === "error" ? <>
      <p role="alert" className="mt-2 text-sm text-destructive">{state.message}</p>
      <Button className="mt-3" variant="outline" disabled={pending} onClick={retry}>{pending ? "Loading progress…" : "Retry loading progress"}</Button>
    </> : <>
      <p role="status" className="mt-2 text-sm text-muted-foreground">{pending ? "Saving progress…" : progress?.status === "completed" ? "Lesson complete. Your progress is saved." : progress ? `Saved at section ${progress.resumeSection + 1} of ${sections.length}.` : "Not started. Start this lesson to save your reading progress."}</p>
      {!progress ? <Button className="mt-3" disabled={pending} onClick={() => save("start")}>Start lesson</Button> : progress.status === "started" ? <>
        <Button asChild className="mt-3" variant="outline"><a href={`#section-${progress.resumeSection}`}>Resume lesson</a></Button>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="w-full min-w-0 text-sm font-medium sm:w-auto sm:flex-1" htmlFor="reading-section">Reading position
            <select id="reading-section" className="mt-2 w-full" disabled={pending} value={selectedSection} onChange={(event) => setSection(Number(event.target.value))}>
              {sections.map((title, index) => <option key={title} value={index}>{index + 1}. {title}</option>)}
            </select>
          </label>
          <Button variant="outline" disabled={pending} onClick={() => save("resume", selectedSection)}>Save my place</Button>
        </div>
      </> : null}
    </>}
  </Card>;
}

export function LessonCompletion() {
  const { state, pending, save } = useLessonProgress();
  const progress = state.status === "ready" ? state.progress : null;
  const completed = progress?.status === "completed";

  return <div className="flex flex-wrap items-center gap-4" aria-busy={pending}>
    <Button variant="outline" disabled={pending || !progress || completed} onClick={() => save("complete")}>
      <Check />
      {completed ? "Lesson complete" : "Mark lesson complete"}
    </Button>
    <p className="text-xs leading-6 text-muted-foreground">
      Activity only. {completed ? "Completion is saved to your account and does not change mastery." : progress ? "Mark complete when you finish reading. This does not change mastery." : "Start the lesson before marking it complete. Reading activity does not change mastery."}
    </p>
  </div>;
}
