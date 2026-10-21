"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { AccountProfile } from "@/features/auth/profile";

export interface DemoPreferences {
  careerPathId: string;
  dailyMinutes: number;
  explanationLevel: "beginner" | "intermediate" | "advanced";
  theme: "light" | "dark";
}

export const initialPreferences: DemoPreferences = {
  careerPathId: "software-engineering", dailyMinutes: 30,
  explanationLevel: "beginner", theme: "light",
};

type PreferencesContextValue = {
  account: AccountProfile;
  preferences: DemoPreferences;
  updatePreferences: (changes: Partial<DemoPreferences>) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// One small context shares temporary preferences across routes. Refreshing restores the examples.
// No authentication, browser storage, database write, or analytics event occurs here.
export function DemoPreferencesProvider({ children, user }: { children: ReactNode; user: AccountProfile }) {
  const [preferences, setPreferences] = useState(initialPreferences);

  function updatePreferences(changes: Partial<DemoPreferences>) {
    setPreferences((current) => ({ ...current, ...changes }));
  }

  return (
    <PreferencesContext.Provider value={{ account: user, preferences, updatePreferences }}>
      <div data-theme={preferences.theme} className="min-h-screen bg-background text-foreground">{children}</div>
    </PreferencesContext.Provider>
  );
}

export function useDemoPreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("Demo preferences must be used inside their provider.");
  return context;
}
