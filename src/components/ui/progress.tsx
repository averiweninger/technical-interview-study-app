import { cn } from "@/lib/utils";

// Native progress supplies its value to assistive technology without a chart dependency.
export function Progress({ value, label, className }: { value: number; label: string; className?: string; }) {
  return <progress className={cn("progress-bar", className)} max={100} value={value} aria-label={label}>{value}%</progress>;
}
