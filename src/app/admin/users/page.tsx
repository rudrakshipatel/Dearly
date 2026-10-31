import { Suspense } from "react";
import { AdminSkeleton } from "@/components/admin/admin-skeleton";
import { UsersAdmin } from "@/components/admin/users-admin";
import { requireAdminPage } from "@/server/admin";

export const metadata = { title: "Users" };

export default function Page({ searchParams }: PageProps<"/admin/users">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      {searchParams.then((sp) => (
        <Content q={typeof sp.q === "string" ? sp.q : ""} page={Math.max(0, Number(sp.page ?? 0) || 0)} />
      ))}
    </Suspense>
  );
}

async function Content({ q, page }: { q: string; page: number }) {
  const { supabase, user } = await requireAdminPage();
  const { data, error } = await supabase.rpc("admin_list_users", { p_search: q || undefined, p_limit: 25, p_offset: page * 25 });
  if (error) throw error;
  return <UsersAdmin users={data ?? []} q={q} page={page} selfId={user.id} />;
}
