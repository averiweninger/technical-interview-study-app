"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { ArrowUpRight, BookOpen, ChartNoAxesCombined, Check, ChevronRight, CodeXml, Compass, FlaskConical, LayoutDashboard, Menu, Moon, Route, Settings, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoPreferences } from "@/features/settings/demo-preferences";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/career-paths", label: "Career Paths", icon: Route },
  { href: "/learn", label: "Study Topics", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: CodeXml },
  { href: "/progress", label: "Progress", icon: ChartNoAxesCombined },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Brand() {
  return <Link href="/dashboard" className="flex items-center gap-3" aria-label="Interview Compass dashboard">
    <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
      <Compass size={25} strokeWidth={1.6} />
    </span>
    <span className="text-[15px] font-bold leading-tight tracking-tight">Interview<span className="block text-muted-foreground font-medium">Compass</span>
    </span>
  </Link>;
}

// This boundary needs the current route and event handlers; server-rendered page content arrives as children.
export function AppShell({ children }: { children: ReactNode; }) {
  const pathname = usePathname();
  const mobileMenu = useRef<HTMLDetailsElement>(null);
  const { preferences, updatePreferences } = useDemoPreferences();
  const currentPage = navigation.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const pageLabel = pathname.startsWith("/lessons/") ? "Lesson" : currentPage?.label ?? "Workspace";

  function navLinks() {
    return navigation.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || pathname.startsWith(`${href}/`) || (href === "/learn" && pathname.startsWith("/lessons/"));
      return <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={() => { if (mobileMenu.current) mobileMenu.current.open = false; }}
        className={cn("nav-link", active && "nav-link-active")}>
        <Icon size={19} strokeWidth={1.8} />
        {label}
        {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
      </Link>;
    });
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <aside className="sidebar">
        <Brand />
        <p className="mt-12 mb-4 px-3 text-[10px] font-bold tracking-[0.18em] text-muted-foreground">YOUR WORKSPACE</p>
        <nav aria-label="Main navigation" className="space-y-1.5">{navLinks()}</nav>
        <div className="mt-auto pt-10">
          <div className="rounded-xl border border-border bg-muted/60 p-4">
            <span className="mb-3 flex size-8 items-center justify-center rounded-lg bg-card text-primary"><Check size={17} /></span>
            <p className="text-sm font-semibold">Small steps. Real growth.</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">A little focused practice goes a long way.</p>
            <Link href="/learn" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary">Find your next lesson <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
            <span className="avatar">{preferences.displayName.slice(0, 1).toUpperCase()}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{preferences.displayName}</span>
              <span className="text-xs text-muted-foreground">Demo learner</span>
            </span>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <div className="hidden items-center gap-3 text-sm md:flex">
            <span className="text-muted-foreground">Workspace</span>
            <ChevronRight size={14} className="text-muted-foreground" />
            <span className="font-medium">{pageLabel}</span>
          </div>
          <div className="md:hidden"><Brand /></div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground sm:inline-flex">
              <FlaskConical size={13} />Frontend preview</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={preferences.theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
              onClick={() => updatePreferences({ theme: preferences.theme === "light" ? "dark" : "light" })}>
              {preferences.theme === "light" ? <Moon /> : <Sun />}
            </Button>
            <span className="avatar hidden sm:flex" aria-label="Demo profile">{preferences.displayName.slice(0, 1).toUpperCase()}</span>
          </div>
        </header>
        <details ref={mobileMenu} className="mobile-navigation md:hidden">
          <summary className="flex cursor-pointer items-center gap-2 px-5 py-3 text-sm font-semibold">
            <Menu size={18} />Navigation<span className="ml-auto text-xs font-normal text-muted-foreground">{pageLabel}</span>
          </summary>
          <nav aria-label="Mobile navigation" className="space-y-1 border-t border-border px-3 py-3">{navLinks()}</nav>
        </details>
        <main id="main-content" className="page-content" tabIndex={-1}>
          <div className="demo-notice">
            <span className="size-1.5 shrink-0 rounded-full bg-primary" />
            <p><strong>Demo workspace.</strong> Progress and activity are sample data. Preferences and practice answers reset on refresh.</p>
          </div>
          {children}
          <footer className="page-footer"><span>Interview Compass</span><span>Built for steady progress, one concept at a time.</span></footer>
        </main>
      </div>
    </>
  );
}
