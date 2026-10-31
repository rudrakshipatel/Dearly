import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { publicEnv } from "../env";
import { NotConfiguredError, serverEnv } from "@/server/config";
import type { Database } from "./database.types";

/** Server client acting as the signed-in user (from cookies). RLS applies. */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component — the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** Anonymous client without cookies — safe inside `use cache` and for public RPCs. */
export function supabaseAnon() {
  return createClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Service-role client for verified webhooks and background jobs only. Never use with user input as identity. */
export function supabaseService() {
  if (!serverEnv.supabaseServiceRoleKey) throw new NotConfiguredError("Supabase service role", "SUPABASE_SERVICE_ROLE_KEY");
  return createClient<Database>(publicEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
