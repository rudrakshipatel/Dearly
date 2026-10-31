"use client";

import Link from "next/link";
import { moderateCard } from "@/app/admin/actions";
import { formatDate } from "@/lib/utils";
import { Button } from "../ui/button";
import { Badge, Chip, EmptyState } from "../ui/misc";
import { useAdminAction } from "./use-action";

interface Report {
  id: string;
  card_id: string;
  slug: string;
  title: string;
  owner_email: string | null;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  card_disabled: boolean;
  report_count: number;
}

export function ModerationAdmin({ reports, status }: { reports: Report[]; status: string }) {
  const { run, pending } = useAdminAction();
  return (
    <>
      <h1 className="font-display text-5xl">Moderation</h1>
      <div className="mt-6 flex gap-2">
        {["open", "actioned", "dismissed"].map((s) => (
          <Link key={s} href={`/admin/moderation?status=${s}`}>
            <Chip active={status === s} className="capitalize">
              {s}
            </Chip>
          </Link>
        ))}
      </div>
      {reports.length === 0 ? (
        <EmptyState className="mt-6" title="Nothing to review" description="Reports from recipients appear here." />
      ) : (
        <ul className="mt-6 space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line bg-paper p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {r.title || "Untitled"} <span className="text-muted">· {r.owner_email ?? "sample card"}</span>
                  </p>
                  <p className="mt-1 text-[13px] text-muted">
                    <Badge tone="rose" className="capitalize">
                      {r.reason}
                    </Badge>{" "}
                    {formatDate(r.created_at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })} · {r.report_count} report{r.report_count === 1 ? "" : "s"} on this card
                    {r.card_disabled && " · card disabled"}
                  </p>
                  {r.details && <p className="mt-2 max-w-2xl text-[14px]">{r.details}</p>}
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/card/${r.slug}?preview=1`} target="_blank">
                      View card
                    </Link>
                  </Button>
                  {!r.card_disabled ? (
                    <Button
                      size="sm"
                      className="bg-rose-deep hover:bg-rose-deep/90"
                      disabled={pending}
                      onClick={() => {
                        const reason = window.prompt("Reason shown to the owner", "Removed for violating our guidelines");
                        if (reason !== null) void run(() => moderateCard(r.card_id, true, reason, r.id), "Card disabled.");
                      }}
                    >
                      Disable card
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => moderateCard(r.card_id, false, undefined, r.id), "Card restored.")}>
                      Restore card
                    </Button>
                  )}
                  {status === "open" && !r.card_disabled && (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => moderateCard(r.card_id, false, undefined, r.id), "Report dismissed.")}>
                      Dismiss
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
