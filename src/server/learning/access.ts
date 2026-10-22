import "server-only";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/client";
import { getStudySecretKey } from "./configuration";

/** No actor argument: every use case obtains its owner from a fresh verified Auth response. */
export async function getStudyAccess(readOnly = true) {
  const reader = await createSupabaseServerClient({ readOnly });
  const identity = await reader.auth.getUser();
  if (identity.error || !identity.data.user) return null;
  const userId = z.uuid().parse(identity.data.user.id);
  const secret = getStudySecretKey();
  const writer = createClient(getSupabaseConfig().url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return { reader, writer, userId };
}
