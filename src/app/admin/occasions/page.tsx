import { Suspense } from "react";
import { AdminSkeleton } from "@/components/admin/admin-skeleton";
import { OccasionsAdmin, type AdminOccasion } from "@/components/admin/occasions-admin";
import { requireAdminPage } from "@/server/admin";

export const metadata = { title: "Occasions" };

export default function Page() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase.from("occasions").select("id, name, slug, description, is_active, sort_order, theme_config, thumbnail_url").order("sort_order");
  if (error) throw error;
  return <OccasionsAdmin occasions={(data ?? []) as unknown as AdminOccasion[]} />;
}
