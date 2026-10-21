"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

// Next.js error boundaries need a Client Component. Keep internal error details out of the learner UI.
export default function ErrorPage({ reset }: { error: Error & { digest?: string; }; reset: () => void; }) {
  return <div className="py-12">
    <h1>This page could not be opened.</h1>
    <p className="mt-3 text-sm text-muted-foreground">Try again, or return to the topic library.</p>
    <div className="mt-6 flex flex-wrap gap-3">
      <Button onClick={reset}>Try again</Button>
      <Button variant="outline" asChild><Link href="/learn">Browse topics</Link></Button>
    </div>
  </div>;
}
