"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, CheckCheck, Flame, Layers3, Sparkles } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TopicCard } from "@/components/learning/topic-card";
import { ActivitySummary } from "@/components/learning/activity-summary";
import { StudyActivity } from "@/components/charts/study-activity";
import { topics } from "@/data/mock/curriculum";
import { demoStats, upcomingReviews } from "@/data/mock/progress";
import { useDemoPreferences } from "@/features/settings/demo-preferences";

// Only the greeting is personalized. All performance data below comes from the labeled fixtures.
export function Dashboard() {
  const { preferences } = useDemoPreferences();
  const statCards = [
    { label: "Study progress", value: `${demoStats.completion}%`, note: "Sample topic completion", icon: BookOpen },
    { label: "Questions completed", value: demoStats.answered, note: "Illustrative practice history", icon: CheckCheck },
    { label: "Topics in progress", value: demoStats.activeTopics, note: "Across the sample curriculum", icon: Layers3 },
    { label: "Study streak", value: `${demoStats.streak} days`, note: "Example consecutive study days", icon: Flame },
  ];

  return (
    <>
      <PageHeading
        eyebrow="A LITTLE PRACTICE, EVERY DAY"
        title={`Welcome back, ${preferences.displayName}.`}
        description="Build your knowledge. Practice with purpose. Find your next step."
        action={<Button asChild><Link href="/lessons/sql-joins">Continue learning <ArrowRight /></Link></Button>} />
      <section className="hero" aria-labelledby="next-step-title">
        <div className="relative z-1">
          <span className="hero-label"><Sparkles size={13} />YOUR NEXT STEP · SAMPLE RECOMMENDATION</span>
          <h2 id="next-step-title">Turn a concept into confidence.</h2>
          <p>Connect the dots with SQL joins. Work through a practical example, then check your understanding.</p>
          <Link
            href="/lessons/sql-joins"
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#e2f1e9] px-4 py-2 text-xs font-semibold text-[#173c3a] hover:bg-white">Explore SQL joins <ArrowUpRight size={15} />
          </Link>
          <span className="ml-3 inline-block text-[11px] text-[#bdcfcb]">12 min lesson</span>
        </div>
        <div
          className="progress-ring mr-3"
          style={{ "--ring-value": `${demoStats.completion}%` } as CSSProperties}
          role="img"
          aria-label={`${demoStats.completion}% illustrative overall completion`}>
          <div className="progress-ring-inner">
            <span className="text-4xl font-semibold tracking-tight">{demoStats.completion}<span className="text-lg">%</span></span>
            <span className="mt-1 text-[10px] text-[#bdcfcb]">SAMPLE PROGRESS</span>
          </div>
        </div>
      </section>
      <section aria-label="Sample study statistics" className="mt-5 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, note, icon: Icon }) => <Card key={label} className="stat-card">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <Icon size={17} className="text-primary" />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1.5 text-[10px] leading-5 text-muted-foreground">{note}</p>
        </Card>)}
      </section>
      <section className="mt-8" aria-labelledby="continue-title">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 id="continue-title" className="section-title">Pick up where you left off</h2>
            <p className="section-caption">A few foundations worth coming back to.</p>
          </div>
          <Link href="/learn" className="section-link">All topics <ArrowRight size={14} /></Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {["python", "sql", "algorithms"].map((id) => <TopicCard key={id} topic={topics.find((topic) => topic.id === id)!} />)}
        </div>
      </section>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="section-title">Recent activity</h2>
            <Link href="/progress" className="section-link">View progress <ArrowUpRight size={14} /></Link>
          </div>
          <p className="section-caption">An illustrative learning history.</p>
          <ActivitySummary />
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="section-title">Study rhythm</h2>
            <span className="pill">Sample week</span>
          </div>
          <StudyActivity />
        </Card>
      </div>
      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="section-title">A little review goes a long way</h2>
            <p className="section-caption">Sample upcoming topics. Automatic review scheduling is planned for Phase 2.</p>
          </div>
          <CalendarDays size={18} className="text-primary" />
        </div>
        <ul className="mt-4 grid gap-3 lg:grid-cols-3">
          {upcomingReviews.map((review) => <li key={review.title}>
            <Link href={review.href} className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 hover:bg-muted">
              <div>
                <span className="text-[10px] font-medium text-primary">{review.label} · example</span>
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
