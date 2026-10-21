"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarDays } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TopicCard } from "@/components/learning/topic-card";
import { ActivitySummary } from "@/components/learning/activity-summary";
import { StudyActivity } from "@/components/charts/study-activity";
import { topics } from "@/data/mock/curriculum";
import { demoStats, upcomingReviews } from "@/data/mock/progress";
import { useDemoPreferences } from "@/features/settings/demo-preferences";

// Only the greeting is personalized. All performance data below comes from the labeled fixtures.
export function Dashboard() {
  const { account } = useDemoPreferences();
  const statCards = [
    { label: "Study progress", value: `${demoStats.completion}%`, note: "Sample topic completion" },
    { label: "Questions completed", value: demoStats.answered, note: "Sample practice history" },
    { label: "Topics in progress", value: demoStats.activeTopics, note: "Across the sample curriculum" },
    { label: "Study streak", value: `${demoStats.streak} days`, note: "Example consecutive study days" },
  ];

  return (
    <>
      <PageHeading
        eyebrow="Overview"
        title={`Welcome back, ${account.displayName}.`}
        description="Review sample progress and continue with a lesson or practice set."
        action={<Button variant="outline" asChild><Link href="/practice">Open practice <ArrowRight /></Link></Button>} />
      <section aria-label="Sample study statistics" className="metric-strip">
        {statCards.map(({ label, value, note }, index) => <div key={label} className="metric-item">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="metric-value">{value}</p>
          {index === 0 && <Progress value={demoStats.completion} label="Sample overall study progress" className="mt-3" />}
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
        </div>)}
      </section>
      <section aria-labelledby="next-step-title" className="mt-6">
        <Card className="recommended-lesson">
          <div>
            <p className="eyebrow">Recommended lesson · sample</p>
            <h2 id="next-step-title">SQL joins</h2>
            <p className="mt-2 text-sm text-muted-foreground">Review INNER and LEFT JOIN, then try the knowledge check.</p>
            <p className="mt-2 text-xs text-muted-foreground">SQL fundamentals · 12 min</p>
          </div>
          <Button asChild><Link href="/lessons/sql-joins">Continue learning <ArrowRight /></Link></Button>
        </Card>
      </section>
      <section className="mt-8" aria-labelledby="continue-title">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 id="continue-title" className="section-title">Topics in progress</h2>
            <p className="section-caption">Sample completion across three foundational topics.</p>
          </div>
          <Link href="/learn" className="section-link">All topics <ArrowRight size={14} /></Link>
        </div>
        <div className="topic-list">
          {["python", "sql", "algorithms"].map((id) => <TopicCard key={id} topic={topics.find((topic) => topic.id === id)!} />)}
        </div>
      </section>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card className="p-4 sm:p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="section-title">Recent activity</h2>
            <Link href="/progress" className="section-link">View progress <ArrowUpRight size={14} /></Link>
          </div>
          <p className="section-caption">An illustrative learning history.</p>
          <ActivitySummary />
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">Study activity</h2>
            <span className="text-xs text-muted-foreground">Sample week</span>
          </div>
          <StudyActivity />
        </Card>
      </div>
      <Card className="mt-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="section-title">Upcoming review topics</h2>
            <p className="section-caption">Sample upcoming topics. Automatic review scheduling is planned for Phase 2.</p>
          </div>
          <CalendarDays size={18} className="text-primary" />
        </div>
        <ul className="mt-4 divide-y divide-border">
          {upcomingReviews.map((review) => <li key={review.title}>
            <Link href={review.href} className="flex items-center justify-between gap-4 py-4 hover:text-primary">
              <div>
                <span className="text-xs text-muted-foreground">{review.label} · example</span>
                <p className="mt-1 text-sm font-medium">{review.title}</p>
              </div>
              <ArrowUpRight size={16} className="text-muted-foreground" />
            </Link>
          </li>)}
        </ul>
      </Card>
    </>
  );
}
