"use client";

import { careerPaths } from "@/data/mock/curriculum";
import type { PathSelection } from "./career-path-selection";

export function PathSelectionFields({ value, onChange, disabled = false }: { value: PathSelection; onChange: (value: PathSelection) => void; disabled?: boolean }) {
  function toggle(id: string, checked: boolean) {
    const selectedCareerPathIds = checked ? [...value.selectedCareerPathIds, id] : value.selectedCareerPathIds.filter((path) => path !== id);
    onChange({ selectedCareerPathIds, careerPathId: selectedCareerPathIds.includes(value.careerPathId) ? value.careerPathId : selectedCareerPathIds[0] ?? "" });
  }
  return <fieldset disabled={disabled} className="min-w-0 space-y-4">
    <legend className="field-label">Selected career paths</legend>
    <p className="text-sm text-muted-foreground">Select one or more paths. Shared lessons and history are kept once, even when a path is removed.</p>
    <div className="grid gap-2 sm:grid-cols-2">{careerPaths.map((path) => <label key={path.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded border border-border px-3 py-2 text-sm">
      <input type="checkbox" checked={value.selectedCareerPathIds.includes(path.id)} onChange={(event) => toggle(path.id, event.target.checked)} />
      {path.name}
    </label>)}</div>
    <div>
      <label htmlFor="preferred-path" className="field-label">Preferred career path</label>
      <select id="preferred-path" className="field" required value={value.careerPathId} onChange={(event) => onChange({ ...value, careerPathId: event.target.value })}>
        {!value.selectedCareerPathIds.length && <option value="">Select a path first</option>}
        {careerPaths.filter((path) => value.selectedCareerPathIds.includes(path.id)).map((path) => <option key={path.id} value={path.id}>{path.name}</option>)}
      </select>
      <p className="mt-2 text-xs text-muted-foreground">Your primary path controls dashboard recommendations and default study and practice ordering.</p>
    </div>
  </fieldset>;
}
