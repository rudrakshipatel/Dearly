import "server-only";
import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Verifies the signed-in user is an admin (role checked in the database, not the client).
 * Non-admins get a 404 so the admin area isn't revealed.
 */
export async function requireAdminPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/sign-in?next=/admin");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) notFound();
  return { supabase, user: data.user };
}
