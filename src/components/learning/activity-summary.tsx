import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { recentActivity } from "@/data/mock/progress";

export function ActivitySummary() {
  return <ul className="divide-y divide-border">
    {recentActivity.map((activity) => <li key={activity.title}>
      <Link className="flex items-center gap-3 py-4 hover:text-primary" href={activity.href}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Check size={16} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{activity.title}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{activity.detail}</span>
        </span>
        <span className="hidden text-xs text-muted-foreground sm:block">{activity.label}</span>
        <ArrowUpRight size={14} className="shrink-0 text-muted-foreground" />
      </Link>
    </li>)}
  </ul>;
}
