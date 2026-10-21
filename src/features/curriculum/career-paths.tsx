"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { careerPaths, topics } from "@/data/mock/curriculum";
import { useDemoPreferences } from "@/features/settings/demo-preferences";

export function CareerPaths() {
  const { preferences, updatePreferences } = useDemoPreferences();
  const selected = careerPaths.find((path) => path.id === preferences.careerPathId) ?? careerPaths[0];

  return (
    <>
      <PageHeading
        eyebrow="Preparation"
        title="Career paths"
        description="Choose a career focus to see its subjects. Paths share the same curriculum." />
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
              aria-label={selected.id === path.id ? `Selected path: ${path.name}` : `Choose ${path.name}`}
              onClick={() => updatePreferences({ careerPathId: path.id })}>
              {selected.id === path.id ? <><Check />Selected</> : "Choose"}
            </Button>
          </Card>
        ))}
        </div>
      <section className="selection-panel rounded-lg border border-border bg-card" aria-labelledby="selected-path-title">
        <div aria-live="polite">
          <p className="eyebrow">Selected path</p>
          <h2 id="selected-path-title" className="text-lg font-semibold">{selected.name}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Shared with Settings for this visit. Refreshing restores the demo default.</p>
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
