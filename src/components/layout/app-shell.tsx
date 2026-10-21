"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { ArrowUpRight, BookOpen, ChartNoAxesCombined, ChevronRight, CodeXml, Compass, LayoutDashboard, Menu, Moon, Route, Settings, Sun } from "lucide-react";
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
    <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
      <Compass size={25} strokeWidth={1.6} />
    </span>
    <span className="text-[15px] font-bold leading-tight tracking-tight">Interview{" "}<span className="block text-muted-foreground font-medium">Compass</span>
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
      </Link>;
    });
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <aside className="sidebar">
        <Brand />
        <p className="mt-10 mb-2 px-4 text-xs font-medium text-muted-foreground">Workspace</p>
        <nav aria-label="Main navigation" className="space-y-1.5">{navLinks()}</nav>
        <div className="mt-auto pt-10">
          <div className="px-4">
            <p className="text-xs font-medium text-muted-foreground">Curriculum</p>
            <Link href="/learn" className="section-link">Browse lessons <ArrowUpRight size={14} /></Link>
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
            <span className="hidden text-xs text-muted-foreground sm:block">Frontend preview</span>
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
          <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium">
            <Menu size={18} />Navigation<span className="ml-auto text-xs font-normal text-muted-foreground">{pageLabel}</span>
          </summary>
          <nav aria-label="Mobile navigation" className="space-y-1 border-t border-border px-3 py-3">{navLinks()}</nav>
        </details>
        <main id="main-content" className="page-content" tabIndex={-1}>
          <div className="demo-notice">
            <p><strong>Demo workspace.</strong> Progress and activity are sample data. Preferences and practice answers reset on refresh.</p>
          </div>
          {children}
          <footer className="page-footer"><span>Interview Compass</span><span>Educational preview · sample data</span></footer>
        </main>
      </div>
    </>
  );
}
