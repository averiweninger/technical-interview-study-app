"use client";

import { useState, type FormEvent } from "react";
import { Check, Monitor, SlidersHorizontal, UserRound } from "lucide-react";
import { PageHeading } from "@/components/page-heading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { careerPaths } from "@/data/mock/curriculum";
import { useDemoPreferences, type DemoPreferences } from "./demo-preferences";

export function SettingsForm() {
  const { preferences, updatePreferences } = useDemoPreferences();
  // Theme is applied immediately through the provider. The remaining fields form a local draft.
  const [draft, setDraft] = useState<Omit<DemoPreferences, "theme">>({
    displayName: preferences.displayName,
    careerPathId: preferences.careerPathId,
    dailyMinutes: preferences.dailyMinutes,
    explanationLevel: preferences.explanationLevel,
  });
  const [message, setMessage] = useState("");

  function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = draft.displayName.trim();
    if (!displayName) { setMessage("Enter a name containing at least one non-space character."); return; }
    if (!Number.isInteger(draft.dailyMinutes) || draft.dailyMinutes < 5 || draft.dailyMinutes > 240) {
      setMessage("Choose a whole number of minutes between 5 and 240."); return;
    }
    if (!careerPaths.some((path) => path.id === draft.careerPathId)) {
      setMessage("Choose one of the available career paths."); return;
    }
    updatePreferences({ ...draft, displayName });
    setDraft({ ...draft, displayName });
    setMessage("Preferences applied for this visit. Refreshing restores the demo defaults.");
  }

  return <>
    <PageHeading
      eyebrow="Workspace"
      title="Settings"
      description="Adjust your profile, study preferences, and appearance for this visit." />
    <form onSubmit={savePreferences} className="max-w-3xl space-y-6">
      <Card className="p-4 sm:p-6">
        <h2 className="section-title flex items-center gap-2"><UserRound size={18} className="text-primary" />Demo profile</h2>
        <p className="section-caption">No account is connected. This name only changes your greeting and profile initials.</p>
        <div className="mt-6 max-w-lg">
          <label htmlFor="display-name" className="field-label">Display name</label>
          <input
            id="display-name"
            className="field"
            value={draft.displayName}
            onChange={(event) => setDraft({ ...draft, displayName: event.target.value })}
            maxLength={40}
            required
            autoComplete="off" />
        </div>
      </Card>
      <Card className="p-4 sm:p-6">
        <h2 className="section-title flex items-center gap-2"><SlidersHorizontal size={18} className="text-primary" />Study preferences</h2>
        <p className="section-caption">The career path is shared with Career Paths. Time and explanation preferences preview future planner and tutor inputs.</p>
        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="preferred-path" className="field-label">Preferred career path</label>
            <select id="preferred-path" className="field" value={draft.careerPathId} onChange={(event) => setDraft({ ...draft, careerPathId: event.target.value })}>
              {careerPaths.map((path) => <option value={path.id} key={path.id}>{path.name}</option>)}
            </select>
          </div>
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
                onChange={(event) => setDraft({ ...draft, dailyMinutes: event.target.valueAsNumber })}
                required />
              <p className="mt-2 text-xs text-muted-foreground">A preference only; no schedule is generated.</p>
            </div>
            <div>
              <label htmlFor="explanation-level" className="field-label">Preferred explanation level</label>
              <select
                id="explanation-level"
                className="field"
                value={draft.explanationLevel}
                onChange={(event) => { const value = event.target.value; if (value === "beginner" || value === "intermediate" || value === "advanced") setDraft({ ...draft, explanationLevel: value }); }}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <p className="mt-2 text-xs text-muted-foreground">For a future tutor; AI is not connected.</p>
            </div>
          </div>
        </div>
      </Card>
      <Card className="p-4 sm:p-6">
        <h2 className="section-title flex items-center gap-2"><Monitor size={18} className="text-primary" />Appearance</h2>
        <p className="section-caption">Theme changes apply immediately and last for this visit. The header control uses the same preference.</p>
        <div className="mt-6 max-w-lg">
          <label htmlFor="theme" className="field-label">Theme</label>
          <select
            id="theme"
            className="field"
            value={preferences.theme}
            onChange={(event) => { const value = event.target.value; if (value === "light" || value === "dark") updatePreferences({ theme: value }); }}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </Card>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit"><Check />Apply for this visit</Button>
        <p className="text-xs text-muted-foreground" role="status">{message || "Temporary preferences. No permanent storage."}</p>
      </div>
    </form>
  </>;
}
