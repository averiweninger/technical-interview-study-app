import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { accountProfile } from "@/features/auth/profile";

/** Cache only within a render request; never trust the user object decoded from session cookies. */
export const requireUser = cache(async () => {
  try {
    const supabase = await createSupabaseServerClient({ readOnly: true });
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) return accountProfile(data.user);
  } catch {
    // Fail closed without forwarding provider errors, tokens, or configuration to the browser.
  }
  redirect("/login?status=session-ended");
});
