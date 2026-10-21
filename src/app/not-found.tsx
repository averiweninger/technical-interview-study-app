import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <div className="state-panel">
    <p className="eyebrow">404</p>
    <h1>Page not found</h1>
    <p className="mt-3 text-sm text-muted-foreground">This page or lesson is not in the sample workspace.</p>
    <Button className="mt-6" asChild><Link href="/learn">Explore study topics</Link></Button>
  </div>;
}
