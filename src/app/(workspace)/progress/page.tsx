import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BarChart3, CircleHelp } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StudyActivity } from "@/components/charts/study-activity";
import { ActivitySummary } from "@/components/learning/activity-summary";
import { topics } from "@/data/mock/curriculum";
import { topicProgress, demoStats } from "@/data/mock/progress";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  const assessed = topicProgress.filter((row) => row.answered > 0);
  const strongest = [...assessed].sort((a, b) => b.correct / b.answered - a.correct / a.answered).slice(0, 2);
  const needsPractice = assessed.filter((row) => row.mastery === "Needs practice");
  const stats = [
    { label: "Topic completion", value: `${demoStats.completion}%` },
    { label: "Questions answered", value: demoStats.answered },
    { label: "Practice accuracy", value: `${Math.round(demoStats.correct / demoStats.answered * 100)}%` },
    { label: "Topics with sample evidence", value: `${demoStats.activeTopics} / ${topics.length}` },
  ];

  return <>
    <PageHeading
      eyebrow="Learning history"
      title="Progress overview"
      description="Compare sample topic completion, practice accuracy, and study activity." />
    <div className="callout mb-6 flex items-start gap-3">
      <CircleHelp size={19} className="mt-1 shrink-0 text-primary" />
      <p>
        <strong>Sample analytics, not your results.</strong> These static records demonstrate the planned dashboard. Mastery labels are illustrative; they are not calculated from your interactions or an implemented mastery algorithm.</p>
    </div>
    <section aria-label="Illustrative progress statistics" className="metric-strip">
      {stats.map((stat) => <div className="metric-item" key={stat.label}>
        <p className="text-sm text-muted-foreground">{stat.label}</p>
        <p className="metric-value">{stat.value}</p>
      </div>)}
    </section>
    <Card className="mt-6 overflow-hidden">
      <div className="p-4 sm:p-6">
        <h2 className="section-title">Topic progress</h2>
        <p className="section-caption">Sample completion and practice evidence, kept separate.</p>
      </div>
      <div className="overflow-x-auto" role="region" aria-label="Topic progress table" tabIndex={0}>
        <table className="w-full min-w-160 text-left text-sm tabular-nums">
          <caption className="sr-only">Illustrative topic completion, accuracy, and mastery labels. No values reflect this visitor&apos;s activity.</caption>
          <thead className="border-y border-border bg-muted text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="px-6 py-3 font-medium">Topic</th>
              <th scope="col" className="px-5 py-3 font-medium">Completion</th>
              <th scope="col" className="px-5 py-3 font-medium">Questions</th>
              <th scope="col" className="px-5 py-3 font-medium">Accuracy</th>
              <th scope="col" className="px-6 py-3 font-medium">Sample mastery</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {topicProgress.map((row) => <tr key={row.topicId}>
              <th scope="row" className="px-6 py-4 font-medium">
                <Link href={`/learn/${row.topicId}`} className="hover:text-primary">{topics.find((topic) => topic.id === row.topicId)?.name}</Link>
              </th>
              <td className="min-w-36 px-5 py-4">
                <div className="mb-2 text-xs text-muted-foreground">{row.completion}%</div>
                <Progress value={row.completion} label={`${row.topicId} illustrative completion`} />
              </td>
              <td className="px-5 py-4 text-muted-foreground">{row.answered}</td>
              <td className="px-5 py-4 text-muted-foreground">{row.answered ? `${Math.round(row.correct / row.answered * 100)}%` : "—"}</td>
              <td className="px-6 py-4"><span className="pill">{row.mastery}</span></td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </Card>
    <div className="mt-6 grid items-start gap-6 xl:grid-cols-2">
      <Card className="p-6"><h2 className="section-title mb-5">Study activity</h2><StudyActivity /></Card>
      <Card className="p-6">
        <h2 className="section-title">Where to focus</h2>
        <p className="section-caption">Based on the sample practice records.</p>
        <h3 className="eyebrow mt-6">STRONGEST IN THIS SAMPLE</h3>
        <ul className="space-y-3">
          {strongest.map((row) => <li key={row.topicId}>
            <Link href={`/learn/${row.topicId}`} className="flex min-h-11 items-center justify-between gap-4 text-sm hover:text-primary hover:underline">
              <span>{topics.find((topic) => topic.id === row.topicId)?.name}</span>
              <span className="text-primary">{Math.round(row.correct / row.answered * 100)}% sample accuracy</span>
            </Link>
          </li>)}
        </ul>
        <h3 className="eyebrow mt-6">ROOM TO GROW</h3>
        {needsPractice.map((row) => <Link
          key={row.topicId}
          className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm hover:bg-muted"
          href={`/practice?topic=${row.topicId}`}>
          <span>{topics.find((topic) => topic.id === row.topicId)?.name}</span>
          <ArrowUpRight size={15} />
        </Link>)}
        <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-muted-foreground">
          <BarChart3 size={15} className="mt-1 shrink-0" />Accuracy describes these example answers; it is not a prediction of interview success.</p>
      </Card>
    </div>
    <Card className="mt-6 p-6"><h2 className="section-title">Sample learning history</h2><ActivitySummary /></Card>
  </>;
}
