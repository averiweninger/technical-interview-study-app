import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Interview Compass", template: "%s | Interview Compass" },
  description: "A technical interview study workspace with email sign-in and educational sample lessons and practice.",
};

// The protected route group owns the workspace shell; public auth pages use a focused layout.
export default function RootLayout({ children }: { children: ReactNode; }) {
  return <html lang="en"><body className="bg-background text-foreground">{children}</body></html>;
}
