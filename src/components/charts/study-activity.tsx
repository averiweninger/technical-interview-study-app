export function StudyActivity({ days }: { days: { day: string; count: number; label: string }[] }) {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const max = Math.max(1, ...days.map((day) => day.count));
  return <div><p className="mb-6 text-sm text-muted-foreground"><strong className="text-2xl font-semibold tabular-nums text-foreground">{total}</strong> submissions in the last 7 UTC days</p>
    <div className="activity-chart" aria-label="Saved practice submissions by UTC day">{days.map((day) => <div key={day.day} className="flex min-w-0 flex-col items-center gap-2">
      <span className="text-xs tabular-nums text-muted-foreground" aria-hidden="true">{day.count}</span><div className="chart-bar-track" aria-hidden="true"><div className="chart-bar" style={{ height: day.count / max * 100 + "%" }} /></div>
      <span className="text-xs text-muted-foreground">{day.label}<span className="sr-only">: {day.count} submissions on {day.day}</span></span>
    </div>)}</div>
  </div>;
}
