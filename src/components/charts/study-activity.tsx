import { studyActivity } from "@/data/mock/progress";

// A seven-column CSS chart with equivalent per-day text for screen readers.
export function StudyActivity() {
  const totalMinutes = studyActivity.reduce((sum, day) => sum + day.minutes, 0);
  // Derive one shared scale; a nonzero floor also handles a week with no activity.
  const maxMinutes = Math.max(1, ...studyActivity.map((day) => day.minutes));
  return <div>
    <div className="mb-6 flex items-baseline gap-2">
      <span className="text-2xl font-semibold tabular-nums">{totalMinutes}</span>
      <span className="text-sm text-muted-foreground">minutes this sample week</span>
    </div>
    <div className="activity-chart" aria-label="Sample study minutes by day">
      {studyActivity.map((day) => <div key={day.day} className="flex min-w-0 flex-col items-center gap-2">
        <span className="text-xs tabular-nums text-muted-foreground" aria-hidden="true">{day.minutes}</span>
        <div className="chart-bar-track" aria-hidden="true">
          <div className="chart-bar" style={{ height: `${day.minutes / maxMinutes * 100}%` }} />
        </div>
        <span className="text-xs text-muted-foreground">{day.day}<span className="sr-only">: {day.minutes} minutes</span></span>
      </div>)}
    </div>
  </div>;
}
