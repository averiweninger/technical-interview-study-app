"use client";

import Link from "next/link";
import { ArrowRight, Check, Route } from "lucide-react";
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
        eyebrow="PREPARE WITH DIRECTION"
        title="Your goals. Your path."
        description="Choose a focus for your preparation. Shared foundations mean every lesson can take you further." />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {careerPaths.map((path, index) => (
          <Card key={path.id} className={selected.id === path.id ? "border-primary p-6 ring-1 ring-primary" : "p-6"}>
            <div className="flex items-center justify-between gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-primary"><Route size={20} /></span>
              <span className="text-[10px] text-muted-foreground">PATH {String(index + 1).padStart(2, "0")}</span>
            </div>
            <p className="eyebrow mt-5">{path.focus}</p>
            <h2 className="text-lg font-semibold tracking-tight">{path.name}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{path.description}</p>
            <div className="my-5 flex min-h-16 flex-wrap content-start gap-1.5">
              {path.topicIds.map((id) => <span className="pill" key={id}>{topics.find((topic) => topic.id === id)?.name}</span>)}
            </div>
            <Button
              variant={selected.id === path.id ? "default" : "outline"}
              className="w-full"
              aria-pressed={selected.id === path.id}
              onClick={() => updatePreferences({ careerPathId: path.id })}>
              {selected.id === path.id ? <><Check />Selected path</> : <>Choose {path.name}</>}
            </Button>
          </Card>
        ))}
      </div>
      <section className="mt-6 rounded-xl border border-border bg-card p-6" aria-labelledby="selected-path-title">
        <div aria-live="polite">
          <p className="eyebrow">YOUR TEMPORARY SELECTION</p>
          <h2 id="selected-path-title" className="text-xl font-semibold">{selected.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">This selection also appears in Settings. It lasts until you refresh the page.</p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Associated topics">
            {selected.topicIds.map((id) => <li key={id}>
              <Link className="section-link rounded-lg border border-border px-3 py-2 hover:bg-muted" href={`/learn/${id}`}>
                {topics.find((topic) => topic.id === id)?.name}
                <ArrowRight size={13} />
              </Link>
            </li>)}
          </ul>
        </div>
        <Button className="mt-5" asChild><Link href={`/learn?path=${selected.id}`}>Explore this path <ArrowRight /></Link></Button>
      </section>
    </>
  );
}
