"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LessonCompletion() {
  const [completed, setCompleted] = useState(false);

  return <div className="flex flex-wrap items-center gap-4">
    <Button variant="outline" onClick={() => setCompleted(!completed)} aria-pressed={completed}>
      <Check />
      {completed ? "Marked complete for this visit" : "Mark lesson complete"}
    </Button>
    <p role="status" className="text-xs leading-6 text-muted-foreground">
      {completed ? "Activity only. This resets when you leave and does not change sample mastery." : "A temporary reading marker; no progress is saved."}
    </p>
  </div>;
}
