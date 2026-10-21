import { createSupabaseClient } from "../src/lib/supabase/client.ts";

// Initialization is local only: no tables, API requests, or authentication changes.
try {
  const client = createSupabaseClient();
  const { data, error } = await client.auth.getSession();
  if (error || data.session) {
    throw new Error("Unexpected session state.");
  }
  console.log("Supabase client initialized successfully (anonymous, no session persistence). No remote connection was tested.");
} catch {
  // SDK errors may include configuration. Print fixed guidance, never raw errors or client objects.
  console.error("Supabase initialization failed. Check the project URL and publishable key in .env.local.");
  process.exitCode = 1;
}
