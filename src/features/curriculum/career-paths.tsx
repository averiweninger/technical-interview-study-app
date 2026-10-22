"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { ArrowRight, Check } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { careerPaths, topics } from "@/data/mock/curriculum";
import { useDemoPreferences } from "@/features/settings/demo-preferences";
import { PathSelectionFields } from "./path-selection-fields";
import type { PathSelection } from "./career-path-selection";
import { saveCareerPath } from "@/features/settings/career-path-actions";

export function CareerPaths() {
  const { preferences } = useDemoPreferences();
  const selected = careerPaths.find((path) => path.id === preferences.careerPathId) ?? careerPaths[0];
  const [draft, setDraft] = useState<PathSelection>({ careerPathId: preferences.careerPathId, selectedCareerPathIds: preferences.selectedCareerPathIds });
  const [baseline, setBaseline] = useState(preferences);
  if (JSON.stringify(baseline) !== JSON.stringify(preferences)) {
    setBaseline(preferences);
    if (draft.careerPathId === baseline.careerPathId && JSON.stringify(draft.selectedCareerPathIds) === JSON.stringify(baseline.selectedCareerPathIds)) setDraft({ careerPathId: preferences.careerPathId, selectedCareerPathIds: preferences.selectedCareerPathIds });
  }
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ status: "success" | "error"; message: string } | null>(null);
  const busy = useRef(false);

  function savePaths(selection: PathSelection) {
    if (busy.current) return;
    setDraft(selection);
    busy.current = true;
    startTransition(async () => {
      try { setFeedback(await saveCareerPath(selection)); }
      catch { setFeedback({ status: "error", message: "Your career path could not be saved. Please try again." }); }
      finally { busy.current = false; }
    });
  }

  return (
    <>
      <PageHeading
        eyebrow="Preparation"
        title="Career paths"
        description="Select your interests and one primary career focus. Paths share the same curriculum." />
      <form className="mb-6 max-w-3xl space-y-4" aria-busy={pending} onSubmit={(event) => { event.preventDefault(); savePaths(draft); }}>
        <PathSelectionFields value={draft} disabled={pending} onChange={(value) => { setDraft(value); setFeedback(null); }} />
        <Button disabled={pending} type="submit">{pending ? "Saving career paths..." : "Save career paths"}</Button>
        {(draft.careerPathId !== preferences.careerPathId || JSON.stringify(draft.selectedCareerPathIds) !== JSON.stringify(preferences.selectedCareerPathIds)) && <p className="text-sm text-muted-foreground">Unsaved path changes. Recommendations still use your saved primary path.</p>}
        <p role={feedback?.status === "error" ? "alert" : "status"} className="text-sm">{feedback?.message ?? "Changes are drafts until you save."}</p>
      </form>
      <div className="career-path-layout">
        <div className="career-path-list">
        {careerPaths.map((path) => (
          <Card key={path.id} className={`career-path-row ${selected.id === path.id ? "career-path-selected" : ""}`}>
            <div className="min-w-0">
              <h2 className="text-base font-semibold">{path.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{path.description}</p>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                <span className="font-medium text-foreground">Subjects: </span>
                {path.topicIds.map((id) => topics.find((topic) => topic.id === id)?.name).join(" · ")}
              </p>
            </div>
            <Button
              variant={selected.id === path.id ? "default" : "outline"}
              size="sm"
              aria-pressed={selected.id === path.id}
              aria-label={selected.id === path.id ? `Primary path: ${path.name}` : `Make primary: ${path.name}`}
              disabled={pending}
              onClick={() => savePaths({ careerPathId: path.id, selectedCareerPathIds: preferences.selectedCareerPathIds.includes(path.id) ? preferences.selectedCareerPathIds : [...preferences.selectedCareerPathIds, path.id] })}>
              {selected.id === path.id ? <><Check />Primary</> : "Make primary"}
            </Button>
          </Card>
        ))}
        </div>
      <section className="selection-panel rounded-lg border border-border bg-card" aria-labelledby="selected-path-title">
        <div aria-live="polite">
          <p className="eyebrow">Primary path</p>
          <h2 id="selected-path-title" className="text-lg font-semibold">{selected.name}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Saved to your account. Your dashboard and study topics follow this path.</p>
          {pending && <p className="mt-2 text-sm" role={feedback?.status === "error" && !pending ? "alert" : "status"}>{pending ? "Saving career path..." : feedback?.message}</p>}
          <ul className="mt-4 divide-y divide-border" aria-label="Associated topics">
            {selected.topicIds.map((id) => <li key={id}>
              <Link className="section-link w-full justify-between py-2" href={`/learn/${id}`}>
                {topics.find((topic) => topic.id === id)?.name}
                <ArrowRight size={13} />
              </Link>
            </li>)}
          </ul>
        </div>
        <Button className="mt-6 w-full" asChild><Link href={`/learn?path=${selected.id}`}>Explore this path <ArrowRight /></Link></Button>
      </section>
      </div>
    </>
  );
}
