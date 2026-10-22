"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { ArrowUpRight, BookOpen, ChartNoAxesCombined, CodeXml, Compass, LayoutDashboard, Menu, Moon, Route, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoPreferences } from "@/features/settings/demo-preferences";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "./profile-menu";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/career-paths", label: "Career Paths", icon: Route },
  { href: "/learn", label: "Study Topics", icon: BookOpen },
  { href: "/practice", label: "Practice", icon: CodeXml },
  { href: "/progress", label: "Progress", icon: ChartNoAxesCombined },
];

function Brand() {
  return <Link href="/dashboard" className="flex min-h-11 items-center gap-3" aria-label="Interview Compass dashboard">
    <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
      <Compass size={25} strokeWidth={1.6} />
    </span>
    <span className="text-[15px] font-bold leading-tight tracking-tight">Interview{" "}<span className="block text-muted-foreground font-medium">Compass</span>
    </span>
  </Link>;
}

// This boundary needs the current route and event handlers; server-rendered page content arrives as children.
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const confirmation = useSearchParams().get("confirmation");
  const mobileMenu = useRef<HTMLDetailsElement>(null);
  const { account, preferences, saveTheme, themePending, themeMessage } = useDemoPreferences();
  const currentPage = navigation.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const pageLabel = pathname.startsWith("/lessons/") ? "Lesson" : pathname === "/settings" ? "Settings" : currentPage?.label ?? "Workspace";

  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && mobileMenu.current && !mobileMenu.current.contains(event.target)) mobileMenu.current.open = false;
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  function navLinks() {
    return navigation.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || pathname.startsWith(`${href}/`) || (href === "/learn" && pathname.startsWith("/lessons/"));
      return <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={() => { if (mobileMenu.current) mobileMenu.current.open = false; }}
        className={cn("nav-link", active && "nav-link-active")}>
        <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
        {label}
      </Link>;
    });
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <aside className="sidebar">
        <Brand />
        <p className="mt-6 mb-2 px-4 text-xs font-medium text-muted-foreground">Workspace</p>
        <nav aria-label="Main navigation" className="space-y-1">{navLinks()}</nav>
        <div className="mt-auto pt-6">
          <div className="px-4">
            <p className="text-xs font-medium text-muted-foreground">Curriculum</p>
            <Link href="/learn" className="section-link">Browse lessons <ArrowUpRight size={14} /></Link>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <div className="header-inner">
            <div className="flex min-w-0 items-center gap-2">
              <details ref={mobileMenu} className="mobile-navigation md:hidden" onKeyDown={(event) => {
                if (event.key === "Escape" && mobileMenu.current?.open) {
                  event.preventDefault(); mobileMenu.current.open = false; mobileMenu.current.querySelector("summary")?.focus();
                }
              }} onBlur={(event) => {
                if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
              }}>
                <summary role="button" aria-label="Navigation" aria-controls="mobile-links" className="navigation-trigger"><Menu size={20} aria-hidden="true" /></summary>
                <nav id="mobile-links" aria-label="Mobile navigation" className="mobile-nav-panel">{navLinks()}</nav>
              </details>
              <div className="md:hidden"><Brand /></div>
              <span className="hidden text-sm font-medium md:block">{pageLabel}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="demo-indicator hidden sm:inline" title="Educational sample curriculum. Your activity and preferences are saved to your account.">Sample curriculum</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                disabled={themePending}
                aria-busy={themePending}
                aria-label={preferences.theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
                onClick={() => saveTheme(preferences.theme === "light" ? "dark" : "light")}>
                {preferences.theme === "light" ? <Moon /> : <Sun />}
              </Button>
              <ProfileMenu />
            </div>
          </div>
        </header>
        <main id="main-content" className="page-content" tabIndex={-1}>
          <p className="demo-indicator mb-2 sm:hidden">Educational sample curriculum</p>
          {themePending ? <p role="status" className="mb-4 text-sm">Saving theme…</p> : themeMessage && <p role={themeMessage.status === "error" ? "alert" : "status"} className="mb-4 text-sm">{themeMessage.status === "success" ? "Theme saved to your account." : themeMessage.message}</p>}
          {(confirmation === "signup" || confirmation === "email") && <p role="status" className="feedback mt-6 text-sm">
            {confirmation === "signup" ? "Your email has been confirmed. Welcome to your study workspace."
              : account.pendingEmail ? "Confirmation accepted. Complete any remaining email links to finish your email change." : "Your email address has been confirmed."}
          </p>}
          {children}
          <footer className="page-footer"><span>Interview Compass</span><span>Educational preview</span></footer>
        </main>
      </div>
    </>
  );
}
