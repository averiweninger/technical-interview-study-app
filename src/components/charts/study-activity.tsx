import { studyActivity } from "@/data/mock/progress";

// A seven-column CSS chart with equivalent per-day text for screen readers.
export function StudyActivity() {
  const totalMinutes = studyActivity.reduce((sum, day) => sum + day.minutes, 0);
  return <div>
    <div className="mb-6 flex items-baseline gap-2">
      <span className="text-3xl font-semibold tracking-tight">{totalMinutes}</span>
      <span className="text-sm text-muted-foreground">minutes this sample week</span>
    </div>
    <div className="activity-chart" aria-label="Sample study minutes by day">
      {studyActivity.map((day) => <div key={day.day} className="flex min-w-0 flex-col items-center gap-2">
        <span className="text-[10px] text-muted-foreground">{day.minutes}</span>
        <div className="relative h-24 w-full max-w-7 overflow-hidden rounded-md bg-muted">
          <div className="absolute inset-x-0 bottom-0 rounded-md bg-primary/75" style={{ height: `${day.minutes / 45 * 100}%` }} />
        </div>
        <span className="text-xs text-muted-foreground">{day.day}<span className="sr-only">: {day.minutes} minutes</span></span>
      </div>)}
    </div>
  </div>;
}
