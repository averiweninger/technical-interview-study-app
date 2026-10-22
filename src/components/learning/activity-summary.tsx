import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Activity } from "@/features/progress/types";
export function ActivitySummary({ activities }: { activities: Activity[] }) {
  if (!activities.length) return <p className="mt-4 text-sm leading-6 text-muted-foreground">No saved activity yet. Start a lesson or answer a practice question.</p>;
  return <ul className="divide-y divide-border">{activities.map((activity) => <li key={activity.id}>
    <Link className="flex min-h-11 items-center gap-3 py-3 hover:text-primary" href={activity.href}>
      <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{activity.title}</span><span className="mt-1 block text-xs text-muted-foreground">{activity.detail}</span><time className="mt-1 block text-xs text-muted-foreground" dateTime={activity.at}>{new Date(activity.at).toLocaleString("en", { timeZone: "UTC", dateStyle: "medium", timeStyle: "short" })} UTC</time></span>
      <ArrowUpRight size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  </li>)}</ul>;
}
