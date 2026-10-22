import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { RecoveryForm } from "@/features/auth/recovery-form";
import { getRecoveryAccess } from "@/server/auth/recovery";

export const metadata: Metadata = { title: "Reset password" };
export default async function ResetPasswordPage() {
  const access = await getRecoveryAccess();
  return <Card className="p-6 sm:p-8">
    <h1>Reset password</h1>
    {access ? <><p className="mt-2 mb-8 text-sm text-muted-foreground">Choose a new password for your account.</p><RecoveryForm reset /></> : <div className="mt-6 space-y-4">
      <p role="alert" className="text-sm">A valid recovery link is required. It may have expired or already been used.</p>
      <Link className="section-link" href="/forgot-password">Request a new recovery link</Link>
    </div>}
  </Card>;
}
