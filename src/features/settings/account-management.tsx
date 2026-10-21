"use client";

import { useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDemoPreferences } from "./demo-preferences";
import { updateAccount, type AccountFormState } from "./account-actions";

function AccountFeedback({ state }: { state: AccountFormState }) {
  return state.status !== "idle" ? <p className="feedback mt-4 text-sm" role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null;
}

export function AccountManagement() {
  const { account } = useDemoPreferences();
  const [profileState, profileAction, profilePending] = useActionState(updateAccount.bind(null, "profile"), { status: "idle" } as AccountFormState);
  const [emailState, emailAction, emailPending] = useActionState(updateAccount.bind(null, "email"), { status: "idle" } as AccountFormState);
  return <section aria-labelledby="account-management-title" className="mb-8 max-w-3xl space-y-6">
    <h2 id="account-management-title" className="section-title">Account Management</h2>
    <Card className="p-4 sm:p-6">
      <h3 className="section-title">Personal information</h3>
      <p className="section-caption">Your name is saved to your account and used throughout the workspace.</p>
      <form action={profileAction} onSubmit={(event) => { if (profilePending) event.preventDefault(); }} aria-busy={profilePending} className="mt-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="account-first-name" className="field-label">First name</label>
            <input id="account-first-name" name="firstName" className="field" defaultValue={account.firstName} required maxLength={80} autoComplete="given-name" /></div>
          <div><label htmlFor="account-last-name" className="field-label">Last name</label>
            <input id="account-last-name" name="lastName" className="field" defaultValue={account.lastName} required maxLength={80} autoComplete="family-name" /></div>
        </div>
        <Button disabled={profilePending} type="submit">{profilePending ? "Saving name…" : "Save name"}</Button>
      </form>
      <AccountFeedback state={profileState} />
    </Card>
    <Card className="p-4 sm:p-6">
      <h3 className="section-title">Email address</h3>
      <div className="mt-6"><label htmlFor="current-email" className="field-label">Current email</label>
        <input id="current-email" className="field" value={account.email} readOnly /></div>
      {account.pendingEmail && account.pendingEmail !== account.email && <p className="mt-4 text-sm" role="status">Awaiting confirmation: {account.pendingEmail}</p>}
      <form action={emailAction} onSubmit={(event) => { if (emailPending) event.preventDefault(); }} aria-busy={emailPending} className="mt-6 space-y-6">
        <div><label htmlFor="new-email" className="field-label">New email address</label>
          <input id="new-email" name="email" type="email" className="field" required maxLength={254} autoComplete="email" aria-describedby="email-change-help" />
          <p id="email-change-help" className="mt-2 text-sm text-muted-foreground">Keep access to your current inbox. Complete the confirmation emails before using the new address.</p></div>
        <Button disabled={emailPending} type="submit">{emailPending ? "Requesting change…" : "Request email change"}</Button>
      </form>
      <AccountFeedback state={emailState} />
    </Card>
  </section>;
}

/** No deletion form or button is exposed until privileged deletion and retention handling are configured. */
export function DeleteAccountUnavailable() {
  return <section className="account-danger mt-8 max-w-3xl" aria-labelledby="delete-account-title">
    <h2 id="delete-account-title" className="section-title">Delete Account</h2>
    <p className="mt-2 text-sm">Account deletion is permanent and may remove saved study progress, interview preparation profiles, and other associated data.</p>
    <p className="mt-4 text-sm font-medium" role="status">Account deletion is not available on this deployment. No deletion request can be submitted here.</p>
    <p className="mt-2 text-sm text-muted-foreground">When enabled, deletion will require typing DELETE and recent authentication or password verification. Server-side deletion and retention handling must be configured first.</p>
  </section>;
}
