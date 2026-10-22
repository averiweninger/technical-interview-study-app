import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { RecoveryForm } from "@/features/auth/recovery-form";

export const metadata: Metadata = { title: "Forgot password" };
export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  return <Card className="p-6 sm:p-8">
    <h1>Forgot password?</h1>
    <p className="mt-2 mb-8 text-sm text-muted-foreground">Request a link to choose a new password.</p>
    {params.status === "invalid-link" && <p role="alert" className="feedback mb-6 text-sm">This recovery link is invalid, expired, or already used. Request a new link and use the latest email.</p>}
    <RecoveryForm />
  </Card>;
}
