"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { submitCredentials } from "./actions";
import { safeNextPath, type AuthFormState } from "./validation";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next: string }) {
  const [state, action, pending] = useActionState(submitCredentials.bind(null, mode), { status: "idle" } as AuthFormState);
  const signup = mode === "signup";
  const fields = state.status === "error" ? state.fields : undefined;
  const submitting = useRef(false);
  useEffect(() => { if (!pending) submitting.current = false; }, [pending, state]);

  if (state.status === "confirmation") return <div role="status" className="space-y-4">
    <h2 className="section-title">Check your email</h2>
    <p className="text-sm text-muted-foreground">{state.message}</p>
    <p className="text-sm text-muted-foreground">Open the link to confirm your address, then return to sign in. Check your spam folder if needed.</p>
    <Link className="section-link" href={`/login?next=${encodeURIComponent(safeNextPath(next))}`}>Return to sign in</Link>
  </div>;

  return <form action={action} onSubmit={(event) => {
    // The ref also blocks a second submit in the same tick before React renders pending state.
    if (pending || submitting.current) event.preventDefault(); else submitting.current = true;
  }} className="space-y-6" aria-busy={pending}>
    <input type="hidden" name="next" value={safeNextPath(next)} />
    {signup && <div className="grid gap-4 sm:grid-cols-2">
      {(["firstName", "lastName"] as const).map((name) => <div key={name}>
        <label htmlFor={name} className="field-label">{name === "firstName" ? "First name" : "Last name"}</label>
        <input id={name} name={name} required maxLength={80} autoComplete={name === "firstName" ? "given-name" : "family-name"}
          className="field" aria-invalid={!!fields?.[name]} aria-describedby={fields?.[name] ? `${name}-error` : undefined} />
        {fields?.[name] && <p id={`${name}-error`} className="mt-2 text-sm">{fields[name]}</p>}
      </div>)}
    </div>}
    <div>
      <label htmlFor="email" className="field-label">Email address</label>
      <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} className="field"
        aria-invalid={!!fields?.email} aria-describedby={fields?.email ? "email-error" : undefined} />
      {fields?.email && <p id="email-error" className="mt-2 text-sm text-foreground">{fields.email}</p>}
    </div>
    <div>
      <label htmlFor="password" className="field-label">Password</label>
      <input id="password" name="password" type="password" autoComplete={signup ? "new-password" : "current-password"}
        required minLength={signup ? 8 : 1} maxLength={128} className="field"
        aria-invalid={!!fields?.password} aria-describedby={fields?.password ? "password-error" : signup ? "password-help" : undefined} />
      {signup && <p id="password-help" className="mt-2 text-xs text-muted-foreground">Use at least 8 characters. Your account may require a stronger password.</p>}
      {fields?.password && <p id="password-error" className="mt-2 text-sm text-foreground">{fields.password}</p>}
    </div>
    {state.status === "error" && <p role="alert" className="feedback text-sm">{state.message}</p>}
    <Button type="submit" disabled={pending} className="w-full">{pending ? (signup ? "Creating account…" : "Signing in…") : (signup ? "Create account" : "Sign in")}</Button>
    <p className="text-sm text-muted-foreground">
      {signup ? "Already have an account? " : "New to Interview Compass? "}
      <Link className="section-link" href={`/${signup ? "login" : "signup"}?next=${encodeURIComponent(safeNextPath(next))}`}>
        {signup ? "Sign in" : "Create an account"}
      </Link>
    </p>
  </form>;
}
