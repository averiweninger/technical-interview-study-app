import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Keep the base surface in the CSS components layer so selected/row variants can override it.
// Page-specific utility classes still take precedence when a surface needs a targeted adjustment.
export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card" className={cn("ui-card", className)} {...props} />;
}
