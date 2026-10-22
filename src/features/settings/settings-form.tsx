"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { Check, Monitor, SlidersHorizontal } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PathSelectionFields } from "@/features/curriculum/path-selection-fields";
import { onboardingSchema, setupDestination } from "./onboarding";
import { useDemoPreferences, type DemoPreferences } from "./demo-preferences";
import { AccountManagement, DeleteAccountUnavailable } from "./account-management";
import { completeOnboarding, saveStudyPreferences } from "./preference-actions";
import { preferencesUpdateSchema, type PreferencesResult } from "./study-preferences";

export function SettingsForm({ timezones, onboardingNext }: { timezones: string[]; onboardingNext?: string }) {
  const router = useRouter();
  const onboarding = onboardingNext !== undefined;
  const { preferences, themePending } = useDemoPreferences();
  const [draft, setDraft] = useState<DemoPreferences>(preferences);
  const [baseline, setBaseline] = useState(preferences);
  const [message, setMessage] = useState<PreferencesResult | null>(null);
  // Reconcile a verified server update (including the header theme) without a hydration effect.
  // Keep genuine edits as a visibly unsaved draft rather than replacing them with server values.
  if (JSON.stringify(baseline) !== JSON.stringify(preferences)) {
    setBaseline(preferences);
    const next = { ...draft };
    for (const key of Object.keys(draft) as (keyof DemoPreferences)[]) {
      if (JSON.stringify(draft[key]) === JSON.stringify(baseline[key])) Object.assign(next, { [key]: preferences[key] });
    }
    setDraft(next);
  }
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);

  function editDraft(changes: Partial<DemoPreferences>) {
    setDraft((current) => ({ ...current, ...changes }));
    setMessage(null);
  }

  function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || themePending) return;
    const parsed = (onboarding ? onboardingSchema : preferencesUpdateSchema).safeParse(draft);
    if (!parsed.success) { setMessage({ status: "error", message: parsed.error.issues[0].message }); return; }
    busy.current = true;
    startTransition(async () => {
      try {
        const result = await (onboarding ? completeOnboarding : saveStudyPreferences)(parsed.data);
        setMessage(result);
        if (onboarding && result.status === "success") router.replace(setupDestination(onboardingNext));
      } catch { setMessage({ status: "error", message: "Preferences could not be saved. Please retry." }); }
      finally { busy.current = false; }
    });
  }

  return <>
    <PageHeading
      eyebrow="Workspace"
      title={onboarding ? "Review your preferences" : "Settings"}
      description={onboarding ? "Step 2 of 2. Review your saved preferences to complete setup. Interview date is optional." : "Manage your account, selected career paths, and study preferences."} />
    {!onboarding && <AccountManagement />}
    <form onSubmit={savePreferences} aria-busy={pending || themePending} className="max-w-3xl space-y-6">
      <Card className="p-4 sm:p-6">
        <h2 className="section-title flex items-center gap-2"><SlidersHorizontal size={18} className="text-primary" />Study preferences</h2>
        <p className="section-caption">Save your preferences to use them across visits. Daily goal and explanation level are inputs for future planner and tutor features.</p>
        <fieldset disabled={pending || themePending} className="min-w-0">
        <legend className="sr-only">Study and interview preferences</legend>
        <div className="mt-6 space-y-5">
          <PathSelectionFields value={draft} onChange={editDraft} />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="daily-minutes" className="field-label">Daily study goal (minutes)</label>
              <input
                id="daily-minutes"
                className="field"
                type="number"
                min={5}
                max={240}
                step={1}
                value={Number.isNaN(draft.dailyMinutes) ? "" : draft.dailyMinutes}
                onChange={(event) => editDraft({ dailyMinutes: event.target.valueAsNumber })}
                required />
              <p className="mt-2 text-xs text-muted-foreground">A preference only; no schedule is generated.</p>
            </div>
            <div>
              <label htmlFor="explanation-level" className="field-label">Preferred explanation level</label>
              <select
                id="explanation-level"
                className="field"
                value={draft.explanationLevel}
                onChange={(event) => { const value = event.target.value; if (value === "beginner" || value === "intermediate" || value === "advanced") editDraft({ explanationLevel: value }); }}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <p className="mt-2 text-xs text-muted-foreground">For a future tutor; AI is not connected.</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="timezone" className="field-label">Timezone</label>
              <input id="timezone" className="field" list="timezone-options" value={draft.timezone} maxLength={100} required
                onChange={(event) => editDraft({ timezone: event.target.value })} aria-describedby="timezone-help" />
              <datalist id="timezone-options">{timezones.map((zone) => <option key={zone} value={zone} />)}</datalist>
              <p id="timezone-help" className="mt-2 text-xs text-muted-foreground">Use an IANA timezone, such as America/Indiana/Indianapolis. Defaults to UTC.</p>
            </div>
            <div>
              <label htmlFor="interview-date" className="field-label">Interview date (optional)</label>
              <input id="interview-date" className="field" type="date" min="0001-01-01" max="9999-12-31" value={draft.interviewDate ?? ""}
                onChange={(event) => editDraft({ interviewDate: event.target.value || null })} aria-describedby="interview-date-help" />
              <Button className="mt-2" type="button" variant="outline" disabled={!draft.interviewDate} onClick={() => editDraft({ interviewDate: null })}>Clear interview date</Button>
              <p id="interview-date-help" className="mt-2 text-xs text-muted-foreground">A calendar date in your selected timezone. Save after editing or clearing. No study schedule is generated.</p>
            </div>
          </div>
        </div>
        </fieldset>
      </Card>
      <Card className="p-4 sm:p-6">
        <h2 className="section-title flex items-center gap-2"><Monitor size={18} className="text-primary" />Appearance</h2>
        <p className="section-caption">Choose a theme, then save. The header control saves theme changes directly.</p>
        <div className="mt-6 max-w-lg">
          <label htmlFor="theme" className="field-label">Theme</label>
          <select
            id="theme"
            className="field"
            disabled={pending || themePending}
            value={draft.theme}
            onChange={(event) => { const value = event.target.value; if (value === "light" || value === "dark") editDraft({ theme: value }); }}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </Card>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending || themePending}><Check />{pending ? "Saving preferences..." : onboarding ? "Complete setup" : "Save preferences"}</Button>
        <p className="text-xs text-muted-foreground" role={message?.status === "error" ? "alert" : "status"}>{pending ? "Saving preferences…" : message?.message || "Changes are drafts until you save."}</p>
        {JSON.stringify(draft) !== JSON.stringify(preferences) && !pending && <p className="w-full text-xs text-muted-foreground">Unsaved changes. The workspace continues to use your saved preferences.</p>}
      </div>
    </form>
    {!onboarding && <><p className="mt-6 text-sm"><Link className="section-link" href="/onboarding">Review setup</Link></p><DeleteAccountUnavailable /></>}
  </>;
}
