import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DemoPreferencesProvider } from "@/features/settings/demo-preferences";
import { requireUser } from "@/server/auth/session";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  // Reset temporary demo preferences when the signed-in identity changes.
  return <DemoPreferencesProvider key={user.id} user={user}><AppShell>{children}</AppShell></DemoPreferencesProvider>;
}
