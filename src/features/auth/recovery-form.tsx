"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { requestPasswordRecovery, updateRecoveredPassword } from "./recovery-actions";
import type { AuthFormState } from "./validation";

export function RecoveryForm({ reset = false }: { reset?: boolean }) {
  const [state, action, pending] = useActionState(reset ? updateRecoveredPassword : requestPasswordRecovery, { status: "idle" } as AuthFormState);
  const submitting = useRef(false);
  useEffect(() => { if (!pending) submitting.current = false; }, [pending, state]);
  const fields = state.status === "error" ? state.fields : undefined;
  if (state.status === "confirmation") return <div className="space-y-4">
    <p role="status" className="text-sm">{state.message}</p>
    <Link href="/login" className="section-link">Return to sign in</Link>
  </div>;
  return <form action={action} aria-busy={pending} className="space-y-6" onSubmit={(event) => {
    if (pending || submitting.current) event.preventDefault(); else submitting.current = true;
  }}>
    {reset ? <>
      <div><label className="field-label" htmlFor="new-password">New password</label>
        <input className="field" id="new-password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} disabled={pending} aria-invalid={!!fields?.password} aria-describedby="password-help" />
        <p id="password-help" className="mt-2 text-xs text-muted-foreground">Use 8–128 characters. Your account may require a stronger password.</p></div>
      <div><label className="field-label" htmlFor="confirm-password">Confirm new password</label>
        <input className="field" id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} disabled={pending} /></div>
    </> : <div><label className="field-label" htmlFor="recovery-email">Email address</label>
      <input className="field" id="recovery-email" name="email" type="email" autoComplete="email" required maxLength={254} disabled={pending} aria-invalid={!!fields?.email} /></div>}
    {state.status === "error" && <p role="alert" className="feedback text-sm">{state.message} {reset && <Link className="section-link" href="/forgot-password">Request a new link</Link>}</p>}
    <Button type="submit" className="w-full" disabled={pending}>{pending ? "Please wait…" : reset ? "Update password" : "Send recovery link"}</Button>
    <Link href="/login" className="section-link">Return to sign in</Link>
  </form>;
}
