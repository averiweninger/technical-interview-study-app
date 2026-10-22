import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ActivitySummary } from "@/components/learning/activity-summary";
import { StudyActivity } from "@/components/charts/study-activity";
import { topics } from "@/data/mock/curriculum";
import { getStudyProgress } from "@/server/learning/study-progress";
import { requireUser } from "@/server/auth/session";
import { getCareerPath } from "@/features/curriculum/career-path-selection";
import { interviewDaysRemaining } from "@/features/settings/study-preferences";

export async function Dashboard() {
  const actor = await requireUser();
  const path = getCareerPath(actor.careerPathId);
  const result = await getStudyProgress(path.id);
  const { interviewDate, timezone } = actor.studyPreferences;
  const interviewDays = interviewDate ? interviewDaysRemaining(interviewDate, timezone, new Date()) : null;
  return <div className="dashboard">
    <PageHeading eyebrow="Overview" title="Dashboard" description="Continue a lesson, practice a topic, or review your saved progress." action={<Button variant="outline" asChild><Link href="/practice">Open practice <ArrowRight /></Link></Button>} />
    <p className="mb-4 text-sm text-muted-foreground">Selected path: <strong className="text-foreground">{path.name}</strong> <Link className="ml-2 underline underline-offset-4" href="/career-paths">Change path</Link></p>
    {interviewDate && <p className="mb-4 text-sm text-muted-foreground">Interview date: <time dateTime={interviewDate}>{interviewDate}</time> ({timezone}) · {interviewDays === 0 ? "Interview today" : interviewDays! < 0 ? "Interview date has passed" : `${interviewDays} calendar days remaining`}. <Link className="underline underline-offset-4" href="/settings">Edit preferences</Link></p>}
    {result.status === "error" ? <Card className="p-5"><p role="alert">{result.message}</p><Button asChild variant="outline" className="mt-4"><a href="/dashboard">Reload progress</a></Button></Card> : <>
      <Card className="recommended-lesson">
        <div><h2 className="section-title">Continue learning</h2>
          <h3 className="mt-2 text-lg font-semibold">{result.data.continueLesson?.title ?? "Available path lessons completed"}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{result.data.continueLesson?.reason ?? "Practice a topic to keep building your understanding."}</p>
        </div>
        <Button asChild><Link href={result.data.continueLesson ? "/lessons/" + result.data.continueLesson.id + "#section-" + result.data.continueLesson.section : "/practice"}>Continue learning <ArrowRight /></Link></Button>
      </Card>
      <section aria-label="Your study statistics" className="dashboard-stats mt-4">
        {[
          { label: "Lessons completed", value: result.data.completedLessons + " / " + result.data.totalLessons, note: "Across all paths" },
          { label: "Graded submissions", value: result.data.gradedAttempts, note: "Saved multiple-choice answers" },
          { label: "Practice score", value: result.data.accuracy === null ? "--" : result.data.accuracy + "%", note: "Average score; not mastery" },
          { label: "Self-reviews saved", value: result.data.selfReviews, note: "Ungraded explanations and drafts" },
        ].map((stat) => <Card key={stat.label}><p className="text-sm text-muted-foreground">{stat.label}</p><p className="metric-value">{stat.value}</p><p className="mt-2 text-xs text-muted-foreground">{stat.note}</p></Card>)}
      </section>
      <section className="mt-6" aria-labelledby="topic-progress-title">
        <div className="mb-2 flex items-center justify-between gap-3"><h2 id="topic-progress-title" className="section-title">Topic progress</h2><Link className="section-link" href="/learn">All topics <ArrowRight size={14} /></Link></div>
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {path.topicIds.map((id) => result.data.topics.find((row) => row.topicId === id)!).map((row) => <li key={row.topicId}>
            <Link className="flex min-h-12 flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-muted" href={"/learn/" + row.topicId}>
              <span className="font-medium">{topics.find((topic) => topic.id === row.topicId)?.name}</span>
              <span className="text-xs text-muted-foreground">{row.lessonCount ? `${row.completed}/${row.lessonCount} lessons` : "Lessons coming soon"} | {row.answered} graded submissions</span>
            </Link>
          </li>)}
        </ul>
      </section>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card className="p-4 sm:p-6"><h2 className="section-title">Recent activity</h2><p className="section-caption">Latest lesson updates and saved practice.</p><ActivitySummary activities={result.data.activity.slice(0, 10)} /><Link className="section-link mt-2" href="/progress">View progress <ArrowRight size={14} /></Link></Card>
        <Card className="p-4 sm:p-6"><h2 className="section-title mb-4">Practice activity</h2><StudyActivity days={result.data.days} /></Card>
      </div>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">Curriculum contains educational samples. Practice scores describe saved answers; mastery and automatic review scheduling are not assessed.</p>
    </>}
  </div>;
}
