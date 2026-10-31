import { Suspense } from "react";
import { AdminSkeleton } from "@/components/admin/admin-skeleton";
import { formatBytes } from "@/lib/entitlements";
import { requireAdminPage } from "@/server/admin";

export default function AdminHome() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase.rpc("admin_stats");
  if (error) throw error;
  const s = data as Record<string, number>;
  const tiles: [string, string][] = [
    ["Users", `${s.users} (+${s.newUsers7d} this week)`],
    ["Cards created", String(s.cards)],
    ["Live cards", String(s.published)],
    ["Cards opened", String(s.opened)],
    ["Replies", String(s.reactions)],
    ["Premium purchases", String(s.purchases)],
    ["Active subscriptions", String(s.activeSubscriptions)],
    ["Storage used", formatBytes(Number(s.storageBytes))],
    ["Open reports", String(s.openReports)],
    ["AI generations (30d)", String(s.aiGenerations30d)],
  ];
  return (
    <>
      <h1 className="font-display text-5xl">Platform overview</h1>
      <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {tiles.map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-line bg-paper p-5">
            <dt className="eyebrow">{k}</dt>
            <dd className="mt-2 font-display text-3xl">{v}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
