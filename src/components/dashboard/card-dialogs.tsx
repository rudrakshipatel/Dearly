"use client";

import { Check, Droplets, Eye, HandHeart, Heart, Mail, RefreshCw, Sparkles, ThumbsUp, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useNow } from "@/lib/hooks";
import { creationService, type CardResponses, type CardSummary, type OwnerContribution } from "@/lib/services";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { SharePanel } from "../create/share-panel";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Textarea } from "../ui/form";
import { Badge, Chip, EmptyState, Skeleton } from "../ui/misc";
import { useToast } from "../ui/toast";

const reactionIcon = { love: Heart, tears: Droplets, hug: HandHeart, wow: Sparkles, thanks: ThumbsUp } as const;
const reactionLabel = { love: "Loved it", tears: "Happy tears", hug: "Sent a hug", wow: "Wow", thanks: "Thank you" } as const;

/** Who opened the card and what they said back. */
export function ResponsesDialog({ card, onClose }: { card: CardSummary; onClose: () => void }) {
  const [data, setData] = useState<CardResponses | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = useNow();
  useEffect(() => {
    creationService.responses(card.id).then(setData).catch((e) => setError(e instanceof Error ? e.message : "Couldn't load responses."));
  }, [card.id]);
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent title="Responses" description={card.title}>
        {error ? (
          <p className="text-[14px] text-rose-deep">{error}</p>
        ) : !data ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ["Opens", data.viewCount],
                ["Finished", data.completions],
                ["Replies", data.reactions.length],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-blush/50 px-3 py-4">
                  <p className="font-display text-4xl">{v}</p>
                  <p className="text-[12px] uppercase tracking-widest text-muted">{k}</p>
                </div>
              ))}
            </div>
            {data.lastOpenedAt && (
              <p className="flex items-center gap-2 text-[14px] text-muted">
                <Eye className="size-4" /> Last opened {now ? timeAgo(data.lastOpenedAt, now) : formatDate(data.lastOpenedAt)}
              </p>
            )}
            {data.reactions.length ? (
              <ul className="space-y-3">
                {data.reactions.map((r) => {
                  const Icon = reactionIcon[r.type as keyof typeof reactionIcon] ?? Heart;
                  return (
                    <li key={r.id} className="flex gap-3 rounded-2xl border border-line p-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blush text-burgundy">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium">
                          {reactionLabel[r.type as keyof typeof reactionLabel] ?? r.type} {r.isNew && <Badge tone="rose">New</Badge>}
                        </p>
                        {r.message && <p className="mt-1 font-hand text-xl leading-snug text-ink">{r.message}</p>}
                        {r.photoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element -- signed URL
                          <img src={r.photoUrl} alt="Photo reply" className="mt-2 max-h-48 rounded-xl object-cover" />
                        )}
                        <p className="mt-1 text-[12px] text-muted">{now ? timeAgo(r.createdAt, now) : formatDate(r.createdAt)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState title="No replies yet" description={data.viewCount ? "They've opened it — replies appear here if they send one." : "Once they open your card, you'll see it here."} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Group card moderation: approve or reject submissions, manage the contributor link. */
export function ContributionsDialog({ card, onClose }: { card: CardSummary; onClose: () => void }) {
  const [list, setList] = useState<OwnerContribution[] | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [token, setToken] = useState<string | null>(null);
  const [emails, setEmails] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    Promise.all([creationService.contributions(card.id), creationService.get(card.id)])
      .then(([items, full]) => {
        setList(items);
        setToken(full.contributionToken ?? null);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Couldn't load contributions."));
  }, [card.id, toast]);

  const moderate = async (id: string, status: "approved" | "rejected") => {
    setBusy(id);
    try {
      await creationService.moderateContribution(id, status);
      setList((l) => l?.map((c) => (c.id === id ? { ...c, status } : c)) ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update.");
    } finally {
      setBusy(null);
    }
  };

  const shown = (list ?? []).filter((c) => filter === "all" || c.status === filter);
  const count = (s: OwnerContribution["status"]) => (list ?? []).filter((c) => c.status === s).length;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent title="Contributions" description={`Review messages for ${card.recipientName || "the group card"}. Only approved messages appear on the card.`} size="lg">
        <div className="space-y-6">
          {token ? (
            <div className="space-y-2">
              <SharePanel path={`/together/${token}`} label="Contributor link" />
              <button
                className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"
                onClick={async () => {
                  setToken(await creationService.regenerateToken(card.id));
                  toast.success("New link created — the old one no longer works.");
                }}
              >
                <RefreshCw className="size-3.5" /> Replace link
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  setToken(await creationService.regenerateToken(card.id));
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Couldn't create a link.");
                }
              }}
            >
              Create contributor link
            </Button>
          )}
          {token && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Textarea value={emails} onChange={(e) => setEmails(e.target.value)} className="min-h-12 flex-1" placeholder="Invite by email: sam@example.com, priya@example.com" aria-label="Invite by email" />
              <Button
                variant="outline"
                loading={busy === "invite"}
                onClick={async () => {
                  const list = emails.split(/[\s,;]+/).filter(Boolean);
                  if (!list.length || list.some((e) => !z.string().email().safeParse(e).success)) return toast.error("Check the email addresses.");
                  setBusy("invite");
                  try {
                    const r = await creationService.invite(card.id, list);
                    toast.success(`Invitations sent to ${r.sent}.`);
                    setEmails("");
                  } catch (e) {
                    toast.error({ title: "Invitations weren't sent", description: e instanceof Error ? e.message : undefined });
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                <Mail /> Send
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {(["pending", "approved", "rejected", "all"] as const).map((f) => (
              <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
                <span className="capitalize">{f}</span> {f !== "all" && <span className="opacity-60">{count(f)}</span>}
              </Chip>
            ))}
          </div>

          {list === null ? (
            <Skeleton className="h-40 w-full" />
          ) : shown.length === 0 ? (
            <EmptyState title={filter === "pending" ? "Nothing waiting for review" : "Nothing here"} description="New messages arrive as people sign your card." />
          ) : (
            <ul className="space-y-3">
              {shown.map((c) => (
                <li key={c.id} className="rounded-2xl p-4" style={{ background: c.color }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium uppercase tracking-widest text-ink/60">
                        {c.name} · {formatDate(c.submittedAt, { day: "numeric", month: "short" })}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap font-hand text-xl leading-snug text-ink">{c.message}</p>
                    </div>
                    <Badge tone={c.status === "approved" ? "free" : c.status === "rejected" ? "rose" : "neutral"} className="capitalize">
                      {c.status}
                    </Badge>
                  </div>
                  {c.media.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {c.media.map((m, i) =>
                        m.url ? (
                          m.type === "video" ? (
                            <video key={i} src={m.url} controls className="h-28 rounded-lg" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element -- signed URL
                            <img key={i} src={m.url} alt="" className="h-28 rounded-lg object-cover" />
                          )
                        ) : null,
                      )}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    {c.status !== "approved" && (
                      <Button size="sm" loading={busy === c.id} onClick={() => moderate(c.id, "approved")}>
                        <Check /> Approve
                      </Button>
                    )}
                    {c.status !== "rejected" && (
                      <Button size="sm" variant="outline" className="bg-white/70" onClick={() => moderate(c.id, "rejected")}>
                        <X /> Reject
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn("ml-auto")}
                      aria-label="Delete contribution"
                      onClick={async () => {
                        await creationService.deleteContribution(c.id);
                        setList((l) => l?.filter((x) => x.id !== c.id) ?? null);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
