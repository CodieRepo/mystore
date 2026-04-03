import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Admin/service-role client — NEVER expose to the browser
// Used only in server-side Route Handlers for privileged operations
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
