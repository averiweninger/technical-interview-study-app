import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
      <Link href="/login" className="section-link text-foreground">Interview Compass</Link>
    </header>
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-md px-4 pb-16 pt-8 sm:pt-16">{children}</main>
  </div>;
}
