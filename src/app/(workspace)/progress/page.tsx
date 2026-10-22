import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ActivitySummary } from "@/components/learning/activity-summary";
import { StudyActivity } from "@/components/charts/study-activity";
import { getStudyProgress } from "@/server/learning/study-progress";
import { topics } from "@/data/mock/curriculum";

export const metadata: Metadata = { title: "Progress" };
export default async function ProgressPage() {
  const result = await getStudyProgress();
  return <>
    <PageHeading eyebrow="Learning history" title="Progress overview" description="Your saved lesson completion, practice scores, and recent activity." />
    {result.status === "error" ? <Card className="p-5"><p role="alert">{result.message}</p><Button className="mt-4" asChild variant="outline"><a href="/progress">Reload progress</a></Button></Card> : <>
      <section aria-label="Your progress statistics" className="metric-strip">
        {[
          { label: "Lessons completed", value: result.data.completedLessons + " / " + result.data.totalLessons },
          { label: "Graded submissions", value: result.data.gradedAttempts },
          { label: "Practice score", value: result.data.accuracy === null ? "--" : result.data.accuracy + "%" },
          { label: "Self-reviews saved", value: result.data.selfReviews },
        ].map((stat) => <div key={stat.label} className="metric-item"><p className="text-sm text-muted-foreground">{stat.label}</p><p className="metric-value">{stat.value}</p></div>)}
      </section>
      <p className="mt-4 text-sm text-muted-foreground">Practice score is the average saved multiple-choice score. Self-reviews and reading activity never raise mastery. Topic mastery is not assessed.</p>
      <Card className="mt-6 overflow-hidden"><div className="p-4 sm:p-6"><h2 className="section-title">Topic progress</h2><p className="section-caption">Lesson completion and graded practice are kept separate.</p></div>
        <div className="overflow-x-auto" role="region" aria-label="Topic progress table" tabIndex={0}>
          <table className="w-full min-w-160 text-left text-sm tabular-nums"><caption className="sr-only">Saved completion and practice score by topic. Mastery is not assessed.</caption>
            <thead className="border-y border-border bg-muted text-xs text-muted-foreground"><tr>{["Topic", "Lessons", "Submissions", "Practice score", "Mastery"].map((label) => <th key={label} scope="col" className="px-4 py-3 font-medium">{label}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">{result.data.topics.map((row) => <tr key={row.topicId}>
              <th scope="row" className="px-4 py-3 font-medium"><Link className="hover:text-primary" href={"/learn/" + row.topicId}>{topics.find((topic) => topic.id === row.topicId)?.name}</Link></th>
              <td className="min-w-32 px-4 py-3"><p className="mb-2 text-xs">{row.completed}/{row.lessonCount}</p><Progress value={row.lessonCount ? row.completed / row.lessonCount * 100 : 0} label={row.topicId + " lesson completion"} /></td>
              <td className="px-4 py-3">{row.answered}</td><td className="px-4 py-3">{row.accuracy === null ? "--" : row.accuracy + "%"}</td><td className="px-4 py-3 text-muted-foreground">Not assessed</td>
            </tr>)}</tbody>
          </table>
        </div>
      </Card>
      <div className="mt-6 grid items-start gap-4 xl:grid-cols-2"><Card className="p-4 sm:p-6"><h2 className="section-title mb-4">Practice activity</h2><StudyActivity days={result.data.days} /></Card><Card className="p-4 sm:p-6"><h2 className="section-title">Recent learning history</h2><p className="section-caption">Up to 20 recent entries. Lesson rows show their latest saved update.</p><ActivitySummary activities={result.data.activity} /></Card></div>
    </>}
  </>;
}
