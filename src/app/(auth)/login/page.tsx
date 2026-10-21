import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { AuthForm } from "@/features/auth/auth-form";
import { safeNextPath } from "@/features/auth/validation";

export const metadata: Metadata = { title: "Sign in" };

const notices: Record<string, string> = {
  "signed-out": "You have been signed out.",
  "session-ended": "Your session has ended. Please sign in again.",
  "confirmation-error": "This confirmation link is invalid or has expired. Try the latest email link, or create your account again to request another.",
  "unavailable": "Authentication is temporarily unavailable. Please try again shortly.",
  "email-change-pending": "Your confirmation link was accepted. Complete any remaining email confirmation links, then sign in to check your current email in Settings.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; status?: string }> }) {
  const params = await searchParams;
  const notice = typeof params.status === "string" && Object.hasOwn(notices, params.status) ? notices[params.status] : undefined;
  return <Card className="p-6 sm:p-8">
    <h1>Sign in</h1>
    <p className="mb-8 mt-2 text-sm text-muted-foreground">Continue to your technical interview study workspace.</p>
    {notice && <p role="status" className="feedback mb-6 text-sm">{notice}</p>}
    <AuthForm mode="login" next={safeNextPath(params.next)} />
  </Card>;
}
