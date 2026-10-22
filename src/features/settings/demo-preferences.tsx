"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { AccountProfile } from "@/features/auth/profile";

export interface DemoPreferences {
  careerPathId: string;
  dailyMinutes: number;
  explanationLevel: "beginner" | "intermediate" | "advanced";
  theme: "light" | "dark";
}

export const initialPreferences: Omit<DemoPreferences, "careerPathId"> = {
  dailyMinutes: 30,
  explanationLevel: "beginner", theme: "light",
};

type PreferencesContextValue = {
  account: AccountProfile;
  preferences: DemoPreferences;
  updatePreferences: (changes: Partial<Omit<DemoPreferences, "careerPathId">>) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// Path selection comes from the verified account. Only the remaining preferences are temporary.
export function DemoPreferencesProvider({ children, user }: { children: ReactNode; user: AccountProfile }) {
  const [temporary, setPreferences] = useState(initialPreferences);
  const preferences = { ...temporary, careerPathId: user.careerPathId };

  function updatePreferences(changes: Partial<Omit<DemoPreferences, "careerPathId">>) {
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
