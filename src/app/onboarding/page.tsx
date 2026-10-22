import { AppShell } from "@/components/layout/app-shell";
import { DemoPreferencesProvider } from "@/features/settings/demo-preferences";
import { Onboarding } from "@/features/settings/onboarding-form";
import { setupDestination } from "@/features/settings/onboarding";
import { requireUser } from "@/server/auth/session";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await requireUser();
  const next = setupDestination((await searchParams).next);
  return <DemoPreferencesProvider key={user.id} user={user}><AppShell>
    <Onboarding next={next} timezones={["UTC", ...Intl.supportedValuesOf("timeZone")]} />
  </AppShell></DemoPreferencesProvider>;
}
