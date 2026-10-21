import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <div className="py-12">
    <p className="eyebrow">PAGE NOT FOUND</p>
    <h1>Let's find your next step.</h1>
    <p className="mt-3 text-sm text-muted-foreground">This page or lesson is not in the sample workspace.</p>
    <Button className="mt-6" asChild><Link href="/learn">Explore study topics</Link></Button>
  </div>;
}
