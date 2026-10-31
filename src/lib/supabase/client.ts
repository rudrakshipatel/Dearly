"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "../env";
import type { Database } from "./database.types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Browser client (publishable key + the user's session cookie). RLS applies to every call. */
export function supabaseBrowser() {
  client ??= createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseKey);
  return client;
}
