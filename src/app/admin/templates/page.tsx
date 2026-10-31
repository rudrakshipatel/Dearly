import { Suspense } from "react";
import { AdminSkeleton } from "@/components/admin/admin-skeleton";
import { TemplatesAdmin, type AdminTemplate } from "@/components/admin/templates-admin";
import { requireAdminPage } from "@/server/admin";

export const metadata = { title: "Templates" };

export default function Page() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const { supabase } = await requireAdminPage();
  const [t, o] = await Promise.all([
    supabase.from("templates").select("id, name, slug, description, occasion_id, experience_type, style_category, is_premium, is_published, preview_data, supported_interactions, thumbnail_url").order("name"),
    supabase.from("occasions").select("id, name, slug").order("sort_order"),
  ]);
  if (t.error || o.error) throw t.error ?? o.error;
  return <TemplatesAdmin templates={(t.data ?? []) as unknown as AdminTemplate[]} occasions={o.data ?? []} />;
}
