"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArchiveRestore,
  Bookmark,
  BookmarkCheck,
  Copy,
  Eye,
  Inbox,
  PenLine,
  Plus,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { occasionMap } from "@/lib/data/occasions";
import { useNow, useUser } from "@/lib/hooks";
import { creationService, receivedService } from "@/lib/services";
import type { Creation, CreationStatus, ReceivedCard } from "@/lib/types";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { MotifArt } from "../art/motif";
import { TemplateThumb } from "../art/template-thumb";
import { CardPageView } from "../card/page-view";
import { SharePanel } from "../create/share-panel";
import { Button } from "../ui/button";
import { ConfirmDialog, Dialog, DialogContent } from "../ui/dialog";
import { Badge, Chip, Container, EmptyState, Skeleton } from "../ui/misc";
import { useToast } from "../ui/toast";

type MainTab = "creations" | "received";
type CreationFilter = "all" | CreationStatus;
type ReceivedFilter = "all" | "recent" | "saved";

const statusTone: Record<CreationStatus, "neutral" | "free" | "premium" | "rose"> = {
  draft: "neutral",
  published: "free",
  scheduled: "premium",
  archived: "rose",
};

export function Dashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const user = useUser();
  const now = useNow();
  const toast = useToast();
  const tab: MainTab = params.get("tab") === "received" ? "received" : "creations";
  const [filter, setFilter] = useState<CreationFilter>("all");
  const [rFilter, setRFilter] = useState<ReceivedFilter>("all");
  const [creations, setCreations] = useState<Creation[] | null>(null);
  const [received, setReceived] = useState<ReceivedCard[] | null>(null);
  const [sharing, setSharing] = useState<Creation | null>(null);
  const [deleting, setDeleting] = useState<Creation | null>(null);

  const load = useCallback(async () => {
    const [c, r] = await Promise.all([creationService.list(), receivedService.list()]);
    setCreations(c);
    setReceived(r);
  }, []);

  useEffect(() => {
    creationService.ensureSeeded();
    Promise.all([creationService.list(), receivedService.list()]).then(([c, r]) => {
      setCreations(c);
      setReceived(r);
    });
  }, []);

  const switchTab = (t: MainTab) => {
    router.replace(t === "received" ? "/dashboard?tab=received" : "/dashboard", { scroll: false });
  };

  const counts = useMemo(() => {
    const c = { all: 0, draft: 0, published: 0, scheduled: 0, archived: 0 } as Record<CreationFilter, number>;
    creations?.forEach((x) => {
      c[x.status]++;
      if (x.status !== "archived") c.all++;
    });
    return c;
  }, [creations]);

  const visible = (creations ?? []).filter((c) => (filter === "all" ? c.status !== "archived" : c.status === filter));
  const visibleReceived = (received ?? [])
    .filter((r) => (rFilter === "saved" ? r.saved : rFilter === "recent" ? !!r.openedAt : true))
    .sort((a, b) => (rFilter === "recent" ? (b.openedAt ?? "").localeCompare(a.openedAt ?? "") : b.receivedAt.localeCompare(a.receivedAt)));

  const hour = now === null ? null : new Date(now).getHours();
  const greeting = hour === null ? "Hello" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const run = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      toast.success(success);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  return (
    <Container className="pb-24 pt-8 sm:pt-12">
      {!user && (
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-line bg-paper px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-ink/80">
            <Sparkles className="mr-1.5 inline size-4 text-rose" />
            You&apos;re creating as a guest. Sign in to keep your creations safe across devices.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Create account</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-3">My Dearly</p>
          <h1 className="font-display text-[2.8rem] leading-none tracking-[-0.01em] sm:text-6xl">
            {greeting}
            {user ? <span className="capitalize">, {user.name.split(" ")[0]}</span> : ""}.
          </h1>
        </div>
        <Button asChild size="lg">
          <Link href="/create">
            <Plus /> Create something special
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Dashboard sections" className="mt-10 flex gap-6 border-b border-line">
        {(
          [
            ["creations", "My Creations", counts.all],
            ["received", "Received", received?.length ?? 0],
          ] as const
        ).map(([id, label, n]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => switchTab(id)}
            className={cn("relative -mb-px pb-3 text-[15px] transition-colors", tab === id ? "text-ink" : "text-muted hover:text-ink")}
          >
            {label} <span className="ml-1 text-[12px] text-muted">{n}</span>
            {tab === id && <motion.span layoutId="dash-tab" className="absolute inset-x-0 bottom-0 h-0.5 bg-burgundy" />}
          </button>
        ))}
      </div>

      {tab === "creations" ? (
        <section role="tabpanel" aria-label="My Creations" className="mt-6">
          <div className="scrollbar-none -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            {(
              [
                ["all", "All"],
                ["draft", "Drafts"],
                ["published", "Published"],
                ["scheduled", "Scheduled"],
                ["archived", "Archived"],
              ] as const
            ).map(([id, label]) => (
              <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>
                {label} <span className="opacity-60">{counts[id]}</span>
              </Chip>
            ))}
          </div>

          {creations === null ? (
            <GridSkeleton />
          ) : visible.length === 0 ? (
            creations.length === 0 ? (
              <EmptyState
                icon={<MotifArt motif="envelope" palette="rose-cream" className="mx-auto w-32" />}
                title="Your first creation is waiting"
                description="Pick an occasion, choose how it opens and make it yours. It takes about three minutes."
                action={
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild>
                      <Link href="/create">Create something special</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/editor/demo">Try the designer</Link>
                    </Button>
                  </div>
                }
              />
            ) : (
              <EmptyState
                title={filter === "archived" ? "Nothing archived" : filter === "scheduled" ? "Nothing scheduled yet" : `No ${filter === "all" ? "" : filter} creations`}
                description={filter === "scheduled" ? "Schedule a card to arrive at the perfect moment — birthdays at midnight, anniversaries at breakfast." : "Creations will appear here as you make them."}
                action={
                  <Button asChild variant="outline">
                    <Link href="/create">Create one</Link>
                  </Button>
                }
              />
            )
          ) : (
            <motion.ul layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AnimatePresence initial={false}>
                {visible.map((c) => (
                  <motion.li key={c.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="group flex flex-col rounded-[20px] border border-line bg-paper p-3 shadow-soft">
                    <Link href={`/editor/${c.id}`} className="relative block overflow-hidden rounded-[14px] bg-blush" aria-label={`Edit ${c.title}`}>
                      <div className="mx-auto w-[62%] py-5 transition-transform duration-500 group-hover:scale-[1.03]">
                        <div className="shadow-paper">{c.pages[0] && <CardPageView page={c.pages[0]} />}</div>
                      </div>
                      <Badge tone={statusTone[c.status]} className="absolute left-2.5 top-2.5 capitalize">
                        {c.status}
                      </Badge>
                    </Link>
                    <div className="mt-3 px-1">
                      <h3 className="truncate text-[15px] font-medium">{c.title}</h3>
                      <p className="mt-0.5 text-[12.5px] text-muted">
                        {occasionMap[c.occasion]?.name} · {c.status === "scheduled" && c.scheduledFor ? `Arrives ${formatDate(c.scheduledFor, { day: "numeric", month: "short" })}` : `Edited ${now ? timeAgo(c.updatedAt, now) : formatDate(c.updatedAt)}`}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-line px-0.5 pt-2.5">
                      <div className="flex">
                        <IconAction label="Edit" href={`/editor/${c.id}`} icon={PenLine} />
                        <IconAction label="Preview" href={`/card/${c.slug}?preview=1`} icon={Eye} newTab />
                        <IconAction label="Share" onClick={() => setSharing(c)} icon={Share2} />
                        <IconAction label="Duplicate" onClick={() => run(() => creationService.duplicate(c.id), "Duplicated — find the copy in Drafts.")} icon={Copy} />
                      </div>
                      <div className="flex">
                        {c.status === "archived" ? (
                          <IconAction label="Restore" onClick={() => run(() => creationService.setStatus(c.id, "draft"), "Restored to drafts.")} icon={ArchiveRestore} />
                        ) : (
                          <IconAction label="Archive" onClick={() => run(() => creationService.setStatus(c.id, "archived"), "Archived.")} icon={Archive} />
                        )}
                        <IconAction label="Delete" onClick={() => setDeleting(c)} icon={Trash2} danger />
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </section>
      ) : (
        <section role="tabpanel" aria-label="Received" className="mt-6">
          <div className="mb-6 flex gap-2">
            {(
              [
                ["all", "Cards received"],
                ["recent", "Recently opened"],
                ["saved", "Saved"],
              ] as const
            ).map(([id, label]) => (
              <Chip key={id} active={rFilter === id} onClick={() => setRFilter(id)}>
                {label}
              </Chip>
            ))}
          </div>
          {received === null ? (
            <GridSkeleton />
          ) : visibleReceived.length === 0 ? (
            <EmptyState
              icon={<Inbox className="mx-auto size-8 text-muted" />}
              title={rFilter === "saved" ? "No saved cards yet" : "Nothing here yet"}
              description={rFilter === "saved" ? "Tap “Keep this card” at the end of any card you receive to save it here forever." : "Cards people send you will gather here, so you can open them again whenever you like."}
            />
          ) : (
            <ul className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {visibleReceived.map((r) => (
                <li key={r.slug} className="group">
                  <Link href={`/card/${r.slug}`} className="block overflow-hidden rounded-[18px] border border-line shadow-soft transition-shadow hover:shadow-lift">
                    <TemplateThumb palette={r.palette} motif={r.motif} headline={r.title} />
                  </Link>
                  <div className="mt-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium">From {r.from}</p>
                      <p className="text-[12.5px] text-muted">
                        {occasionMap[r.occasion]?.name} · {r.openedAt ? `Opened ${now ? timeAgo(r.openedAt, now) : ""}` : "Not opened yet"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={r.saved ? "Remove from saved" : "Save card"}
                      aria-pressed={r.saved}
                      onClick={async () => {
                        await receivedService.toggleSave(r.slug);
                        setReceived((list) => list?.map((x) => (x.slug === r.slug ? { ...x, saved: !x.saved } : x)) ?? null);
                      }}
                    >
                      {r.saved ? <BookmarkCheck className="text-burgundy" /> : <Bookmark />}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <Dialog open={!!sharing} onOpenChange={(v) => !v && setSharing(null)}>
        {sharing && (
          <DialogContent title={`Share “${sharing.title}”`} description={sharing.status === "draft" || sharing.status === "archived" ? "This is still a draft. Publish it to share a private link." : "Send this private link however you like."}>
            {sharing.status === "draft" || sharing.status === "archived" ? (
              <Button
                className="w-full"
                onClick={async () => {
                  const done = await creationService.publish(sharing.id);
                  setSharing(done);
                  await load();
                  toast.success("Published! Your link is ready.");
                }}
              >
                Publish now
              </Button>
            ) : (
              <SharePanel path={`/card/${sharing.slug}`} recipient={sharing.recipientName} />
            )}
          </DialogContent>
        )}
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete this creation?"
        description={`“${deleting?.title}” will be permanently deleted${deleting?.status === "published" ? " and its link will stop working" : ""}. This can't be undone.`}
        confirmLabel="Delete forever"
        destructive
        onConfirm={() => run(() => creationService.remove(deleting!.id), "Deleted.")}
      />
    </Container>
  );
}

function IconAction({ label, icon: Icon, onClick, href, newTab, danger }: { label: string; icon: typeof Eye; onClick?: () => void; href?: string; newTab?: boolean; danger?: boolean }) {
  const cls = cn("grid size-8 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink", danger && "hover:bg-blush hover:text-rose-deep");
  if (href)
    return (
      <Link href={href} aria-label={label} title={label} className={cls} target={newTab ? "_blank" : undefined}>
        <Icon className="size-4" />
      </Link>
    );
  return (
    <button onClick={onClick} aria-label={label} title={label} className={cls}>
      <Icon className="size-4" />
    </button>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-[20px] border border-line bg-paper p-3">
          <Skeleton className="aspect-[4/3.6] rounded-[14px]" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
