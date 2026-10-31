import { Suspense } from "react";
import { AdminSkeleton } from "@/components/admin/admin-skeleton";
import { ModerationAdmin } from "@/components/admin/moderation-admin";
import { requireAdminPage } from "@/server/admin";

export const metadata = { title: "Moderation" };

export default function Page({ searchParams }: PageProps<"/admin/moderation">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      {searchParams.then((sp) => (
        <Content status={sp.status === "actioned" || sp.status === "dismissed" ? sp.status : "open"} />
      ))}
    </Suspense>
  );
}

async function Content({ status }: { status: "open" | "actioned" | "dismissed" }) {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase.rpc("admin_reports", { p_status: status, p_limit: 100 });
  if (error) throw error;
  return <ModerationAdmin reports={data ?? []} status={status} />;
}
