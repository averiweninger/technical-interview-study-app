import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// A small shadcn-style surface shared by feature components; content stays with the feature.
export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card" className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-sm", className)} {...props} />;
}
