"use client";

import { useActionState, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDemoPreferences } from "./demo-preferences";
import { updateAccount, type AccountFormState } from "./account-actions";

function AccountFeedback({ state }: { state: AccountFormState }) {
  return state.status !== "idle" ? <p className="feedback mt-4 text-sm" role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null;
}

function EmailManagement() {
  const { account } = useDemoPreferences();
  const [state, action, pending] = useActionState(updateAccount.bind(null, "email"), { status: "idle" } as AccountFormState);
  const [isOpen, setIsOpen] = useState(false);
  const [stateAtOpen, setStateAtOpen] = useState<AccountFormState>(state);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const newEmail = useRef<HTMLInputElement>(null);

  function openDialog() {
    // Keep an in-flight form mounted so its result is still announced if the dialog is dismissed.
    if (!pending) form.current?.reset();
    setStateAtOpen(state);
    setIsOpen(true);
    dialog.current?.showModal();
    newEmail.current?.focus();
  }

  return <Card role="region" aria-labelledby="account-email-title" className="p-4 sm:p-6">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h3 id="account-email-title" className="section-title">Email address</h3>
        <p id="account-current-email" className="mt-1 break-all text-sm text-muted-foreground">{account.email}</p>
      </div>
      <Button ref={trigger} variant="outline" size="sm" type="button" aria-haspopup="dialog" aria-controls="email-change-dialog" onClick={openDialog}>Change email</Button>
    </div>
    {account.pendingEmail && account.pendingEmail !== account.email && <p className="mt-4 break-all text-sm" role="status">Awaiting confirmation: {account.pendingEmail}</p>}
    {!isOpen && <>
      {pending && <p className="mt-4 text-sm" role="status">Requesting email change…</p>}
      {!pending && <AccountFeedback state={state} />}
    </>}
    {/* Native modality makes the background inert; explicit Tab wrapping keeps focus in the form. */}
    <dialog ref={dialog} id="email-change-dialog" className="email-change-dialog p-4 sm:p-6"
      aria-labelledby="email-change-title" aria-describedby="email-change-help"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        // Server Actions add hidden inputs, which must never become focus-loop targets.
        const controls = event.currentTarget.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input:not([type=hidden]):not(:disabled), button:not(:disabled)");
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      }}
      onClose={() => { setIsOpen(false); trigger.current?.focus(); }}>
      <h2 id="email-change-title" className="text-lg font-semibold">Change email</h2>
      <p id="email-change-help" className="mt-2 text-sm text-muted-foreground">Confirm the links sent to your current and new inboxes. Your current email stays active until verification is complete.</p>
      <form ref={form} action={action} onSubmit={(event) => { if (pending) event.preventDefault(); }} aria-busy={pending} className="mt-6 space-y-6">
        <div><label htmlFor="current-email" className="field-label">Current email</label>
          <input id="current-email" className="field" value={account.email} readOnly /></div>
        <div><label htmlFor="new-email" className="field-label">New email address</label>
          <input ref={newEmail} id="new-email" name="email" type="email" className="field" required maxLength={254} autoComplete="email" disabled={pending} /></div>
        {state !== stateAtOpen && <AccountFeedback state={state} />}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" type="button" onClick={() => dialog.current?.close()}>Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? "Processing…" : "Confirm Change"}</Button>
        </div>
      </form>
    </dialog>
  </Card>;
}

export function AccountManagement() {
  const { account } = useDemoPreferences();
  const [profileState, profileAction, profilePending] = useActionState(updateAccount.bind(null, "profile"), { status: "idle" } as AccountFormState);
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
    <EmailManagement />
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
