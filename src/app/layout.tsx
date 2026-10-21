import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DemoPreferencesProvider } from "@/features/settings/demo-preferences";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Interview Compass", template: "%s | Interview Compass" },
  description: "An interactive frontend preview for thoughtful technical interview preparation. Sample data; no accounts or AI services connected.",
};

// App Router layouts persist between navigations. This keeps temporary preferences in memory.
// The layout and pages are Server Components; only the provider and interactive shell need the browser.
export default function RootLayout({ children }: { children: ReactNode; }) {
  return <html lang="en"><body><DemoPreferencesProvider><AppShell>{children}</AppShell></DemoPreferencesProvider></body></html>;
}
