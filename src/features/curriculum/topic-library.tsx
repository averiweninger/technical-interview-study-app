"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { TopicCard } from "@/components/learning/topic-card";
import { Button } from "@/components/ui/button";
import { careerPaths, topics } from "@/data/mock/curriculum";

export function TopicLibrary({ initialPath }: { initialPath?: string; }) {
  const [query, setQuery] = useState("");
  const [pathId, setPathId] = useState(careerPaths.some((path) => path.id === initialPath) ? initialPath! : "all");
  const path = careerPaths.find((item) => item.id === pathId);
  const visibleTopics = topics.filter((topic) => (!path || path.topicIds.includes(topic.id)) && `${topic.name} ${topic.description}`.toLowerCase().includes(query.trim().toLowerCase()));

  function resetFilters() {
    setQuery("");
    setPathId("all");
  }

  return (
    <>
      <PageHeading
        eyebrow="BUILD YOUR FOUNDATION"
        title="One concept at a time."
        description="Explore the essentials, connect new ideas, and practice what you learn. Start small and keep going." />
      <div className="mb-5 flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="topic-search" className="sr-only">Search topics</label>
          <Search size={17} className="pointer-events-none absolute top-3.5 left-3 text-muted-foreground" />
          <input id="topic-search" type="search" className="field pl-10" placeholder="Find a topic..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="sm:w-64">
          <label className="sr-only" htmlFor="path-filter">Filter topics by career path</label>
          <select id="path-filter" className="field" value={pathId} onChange={(event) => setPathId(event.target.value)}>
            <option value="all">All career paths</option>
            {careerPaths.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </div>
      </div>
      <p className="mb-4 text-xs text-muted-foreground" aria-live="polite">
        {visibleTopics.length} {visibleTopics.length === 1 ? "topic" : "topics"} · 6 educational sample lessons available across Python, SQL, and Algorithms</p>
      {visibleTopics.length ? <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{visibleTopics.map((topic) => <TopicCard key={topic.id} topic={topic} />)}</div> : <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <h2 className="text-lg font-semibold">No matching topics</h2>
        <p className="my-3 text-sm text-muted-foreground">Try a different keyword or explore all career paths.</p>
        <Button variant="outline" onClick={resetFilters}>Reset filters</Button>
      </div>}
    </>
  );
}
