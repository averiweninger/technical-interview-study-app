"use client";

import { createContext, useContext, useRef, useState, useTransition, type ReactNode } from "react";
import type { AccountProfile } from "@/features/auth/profile";
import type { StudyPreferences } from "./study-preferences";
import { saveStudyPreferences } from "./preference-actions";

export interface DemoPreferences extends StudyPreferences {
  careerPathId: string;
}

type PreferencesContextValue = {
  account: AccountProfile;
  preferences: DemoPreferences;
  saveTheme: (theme: StudyPreferences["theme"]) => void;
  themePending: boolean;
  themeMessage: { status: "success" | "error"; message: string } | null;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// The verified server DTO supplies both SSR and hydration; there is no browser-storage fallback.
export function DemoPreferencesProvider({ children, user }: { children: ReactNode; user: AccountProfile }) {
  const preferences = { ...user.studyPreferences, careerPathId: user.careerPathId };
  const [themeMessage, setThemeMessage] = useState<PreferencesContextValue["themeMessage"]>(null);
  const [themePending, startTransition] = useTransition();
  const busy = useRef(false);
  function saveTheme(theme: StudyPreferences["theme"]) {
    if (busy.current) return;
    busy.current = true;
    startTransition(async () => {
      try { setThemeMessage(await saveStudyPreferences({ theme })); }
      catch { setThemeMessage({ status: "error", message: "Theme could not be saved. Please try again." }); }
      finally { busy.current = false; }
    });
  }

  return (
    <PreferencesContext.Provider value={{ account: user, preferences, saveTheme, themePending, themeMessage }}>
      <div data-theme={preferences.theme} className="min-h-screen bg-background text-foreground">{children}</div>
    </PreferencesContext.Provider>
  );
}

export function useDemoPreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("Demo preferences must be used inside their provider.");
  return context;
}
