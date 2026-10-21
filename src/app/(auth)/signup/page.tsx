import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { AuthForm } from "@/features/auth/auth-form";
import { safeNextPath } from "@/features/auth/validation";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <Card className="p-6 sm:p-8">
    <h1>Create your account</h1>
    <p className="mb-8 mt-2 text-sm text-muted-foreground">Sign up with email and password. Confirm your email before signing in.</p>
    <AuthForm mode="signup" next={safeNextPath(params.next)} />
  </Card>;
}
