"use client";

import { useRef, useState, useTransition } from "react";
import { PageHeading } from "@/components/page-heading";
import { Button } from "@/components/ui/button";
import { PathSelectionFields } from "@/features/curriculum/path-selection-fields";
import { useDemoPreferences } from "./demo-preferences";
import { saveCareerPath } from "./career-path-actions";
import { SettingsForm } from "./settings-form";
import type { PreferencesResult } from "./study-preferences";

export function Onboarding({ next, timezones }: { next: string; timezones: string[] }) {
  const { account, preferences } = useDemoPreferences();
  const [review, setReview] = useState(account.onboardingPathsSaved);
  const [draft, setDraft] = useState({ careerPathId: preferences.careerPathId, selectedCareerPathIds: preferences.selectedCareerPathIds });
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<PreferencesResult | null>(null);
  const busy = useRef(false);
  if (review) return <><Button className="mb-6" variant="outline" onClick={() => { setDraft({ careerPathId: preferences.careerPathId, selectedCareerPathIds: preferences.selectedCareerPathIds }); setReview(false); }}>Change paths</Button><SettingsForm timezones={timezones} onboardingNext={next} /></>;
  return <>
    <PageHeading eyebrow="Getting started" title="Choose your career paths" description="Step 1 of 2. Select your interests and one primary path. You can change these later without losing progress." />
    <form className="max-w-3xl space-y-6" aria-busy={pending} onSubmit={(event) => {
      event.preventDefault();
      if (busy.current) return;
      busy.current = true;
      startTransition(async () => {
        try {
          const result = await saveCareerPath(draft);
          setMessage(result);
          if (result.status === "success") setReview(true);
        } catch { setMessage({ status: "error", message: "Your paths could not be saved. Please retry." }); }
        finally { busy.current = false; }
      });
    }}>
      <PathSelectionFields value={draft} disabled={pending} onChange={(value) => { setDraft(value); setMessage(null); }} />
      <Button type="submit" disabled={pending}>{pending ? "Saving career paths..." : "Save paths and continue"}</Button>
      <p role={message?.status === "error" ? "alert" : "status"}>{message?.message}</p>
    </form>
  </>;
}
