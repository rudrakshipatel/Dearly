"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setSuspension } from "@/app/admin/actions";
import { formatDate } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/form";
import { Badge } from "../ui/misc";
import { useAdminAction } from "./use-action";

interface Row {
  id: string;
  email: string;
  display_name: string;
  role: string;
  plan: string;
  suspended_at: string | null;
  created_at: string;
  card_count: number;
  last_sign_in_at: string | null;
}

export function UsersAdmin({ users, q, page, selfId }: { users: Row[]; q: string; page: number; selfId: string }) {
  const [search, setSearch] = useState(q);
  const router = useRouter();
  const { run, pending } = useAdminAction();
  return (
    <>
      <h1 className="font-display text-5xl">Users</h1>
      <form
        className="mt-6 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/admin/users?q=${encodeURIComponent(search)}`);
        }}
      >
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email or name" aria-label="Search users" />
        <Button type="submit">Search</Button>
      </form>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <thead className="border-b border-line text-[12px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Cards</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.display_name || "—"}</p>
                  <p className="text-[12px] text-muted">{u.email}</p>
                </td>
                <td className="px-4 py-3 capitalize">
                  {u.plan} {u.role === "admin" && <Badge tone="dark">admin</Badge>}
                </td>
                <td className="px-4 py-3">{u.card_count}</td>
                <td className="px-4 py-3">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3">{u.suspended_at ? <Badge tone="rose">Suspended</Badge> : <Badge tone="free">Active</Badge>}</td>
                <td className="px-4 py-3 text-right">
                  {u.id !== selfId &&
                    (u.suspended_at ? (
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setSuspension(u.id, false), "Suspension lifted.")}>
                        Reinstate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-deep"
                        disabled={pending}
                        onClick={() => {
                          const reason = window.prompt(`Reason for suspending ${u.email}? (shown internally)`);
                          if (reason !== null) void run(() => setSuspension(u.id, true, reason), "User suspended. Their public cards are hidden.");
                        }}
                      >
                        Suspend
                      </Button>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-2">
        {page > 0 && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/users?q=${encodeURIComponent(q)}&page=${page - 1}`}>Previous</Link>
          </Button>
        )}
        {users.length === 25 && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/users?q=${encodeURIComponent(q)}&page=${page + 1}`}>Next</Link>
          </Button>
        )}
      </div>
    </>
  );
}
