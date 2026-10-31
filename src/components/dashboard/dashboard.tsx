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
  MessageSquareHeart,
  PenLine,
  Plus,
  Search,
  Share2,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { occasionMap } from "@/lib/data/occasions";
import { formatBytes } from "@/lib/entitlements";
import { useNow, useSession } from "@/lib/hooks";
import { creationService, receivedService, type CardCounts, type CardSummary, type ListParams, type ReceivedItem } from "@/lib/services";
import type { Creation, CreationStatus } from "@/lib/types";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { MotifArt } from "../art/motif";
import { TemplateThumb } from "../art/template-thumb";
import { ManageCardDialog } from "../card/manage-dialog";
import { CardPageView } from "../card/page-view";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../ui/dialog";
import { Select } from "../ui/form";
import { Badge, Chip, Container, EmptyState, Skeleton } from "../ui/misc";
import { useToast } from "../ui/toast";
import { ContributionsDialog, ResponsesDialog } from "./card-dialogs";

type MainTab = "creations" | "received";
type Filter = NonNullable<ListParams["status"]>;
const PAGE = 12;

const statusTone: Record<CreationStatus, "neutral" | "free" | "premium" | "rose"> = {
  draft: "neutral",
  published: "free",
  scheduled: "premium",
  archived: "rose",
};

export function Dashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const session = useSession();
  const user = session.user;
  const me = session.me;
  const now = useNow();
  const toast = useToast();
  const tab: MainTab = params.get("tab") === "received" ? "received" : "creations";
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<NonNullable<ListParams["sort"]>>("updated");
  const [items, setItems] = useState<CardSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<CardCounts | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [received, setReceived] = useState<ReceivedItem[] | null>(null);
  const [rFilter, setRFilter] = useState<"all" | "recent" | "saved">("all");
  const [managing, setManaging] = useState<Creation | null>(null);
  const [responsesFor, setResponsesFor] = useState<CardSummary | null>(null);
  const [contributionsFor, setContributionsFor] = useState<CardSummary | null>(null);
  const [deleting, setDeleting] = useState<CardSummary | null>(null);
  const requestId = useRef(0);

  // Debounced search.
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(
    async (offset = 0) => {
      const id = ++requestId.current;
      try {
        const res = await creationService.list({ status: filter, q: query || undefined, sort, limit: PAGE, offset });
        if (id !== requestId.current) return; // ignore stale responses
        setItems((prev) => (offset === 0 ? res.items : [...(prev ?? []), ...res.items]));
        setTotal(res.total);
        setCounts(res.counts);
        setError(null);
      } catch (e) {
        if (id === requestId.current) setError(e instanceof Error ? e.message : "Couldn't load your cards.");
      }
    },
    [filter, query, sort],
  );

  useEffect(() => {
    if (!user) return;
    const id = ++requestId.current;
    creationService
      .list({ status: filter, q: query || undefined, sort, limit: PAGE, offset: 0 })
      .then((res) => {
        if (id !== requestId.current) return;
        setItems(res.items);
        setTotal(res.total);
        setCounts(res.counts);
        setError(null);
      })
      .catch((e) => id === requestId.current && setError(e instanceof Error ? e.message : "Couldn't load your cards."));
  }, [filter, query, sort, user]);

  useEffect(() => {
    if (!user || tab !== "received" || received) return;
    receivedService.list().then(setReceived).catch(() => setReceived([]));
  }, [tab, user, received]);

  const switchTab = (t: MainTab) => router.replace(t === "received" ? "/dashboard?tab=received" : "/dashboard", { scroll: false });

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      await load(0);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const openManage = async (c: CardSummary) => {
    try {
      setManaging(await creationService.get(c.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't open sharing settings.");
    }
  };

  const hour = now === null ? null : new Date(now).getHours();
  const greeting = hour === null ? "Hello" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const visibleReceived = (received ?? []).filter((r) => (rFilter === "saved" ? r.saved : true)).sort((a, b) => (rFilter === "recent" ? b.openedAt.localeCompare(a.openedAt) : b.receivedAt.localeCompare(a.receivedAt)));

  if (session.status === "loading" || !user) {
    return (
      <Container className="pt-12">
        <Skeleton className="h-14 w-80" />
        <GridSkeleton />
      </Container>
    );
  }

  return (
    <Container className="pb-24 pt-8 sm:pt-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-3">My Dearly</p>
          <h1 className="font-display text-[2.8rem] leading-none tracking-[-0.01em] sm:text-6xl">
            {greeting}, <span className="capitalize">{user.name.split(" ")[0]}</span>.
          </h1>
        </div>
        <Button asChild size="lg">
          <Link href="/create">
            <Plus /> Create something special
          </Link>
        </Button>
      </div>

      {me && (
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-rose" /> <span className="capitalize text-ink">{me.plan}</span> plan
          </span>
          <span>
            {me.usage.liveCards} / {me.limits.maxLiveCards} live cards
          </span>
          <span>
            {formatBytes(me.usage.storageBytes)} of {formatBytes(me.limits.storageBytes)} storage
          </span>
          <Link href="/account" className="text-burgundy underline-offset-4 hover:underline">
            Account & billing
          </Link>
        </div>
      )}

      <div role="tablist" aria-label="Dashboard sections" className="mt-10 flex gap-6 border-b border-line">
        {(
          [
            ["creations", "My Creations", counts?.all ?? 0],
            ["received", "Received", received?.length ?? 0],
          ] as const
        ).map(([id, label, n]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => switchTab(id)} className={cn("relative -mb-px pb-3 text-[15px] transition-colors", tab === id ? "text-ink" : "text-muted hover:text-ink")}>
            {label} <span className="ml-1 text-[12px] text-muted">{n}</span>
            {tab === id && <motion.span layoutId="dash-tab" className="absolute inset-x-0 bottom-0 h-0.5 bg-burgundy" />}
          </button>
        ))}
      </div>

      {tab === "creations" ? (
        <section role="tabpanel" aria-label="My Creations" className="mt-6">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
              {(
                [
                  ["all", "All"],
                  ["draft", "Drafts"],
                  ["published", "Published"],
                  ["scheduled", "Scheduled"],
                  ["group", "Group cards"],
                  ["archived", "Archived"],
                ] as const
              ).map(([id, label]) => (
                <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>
                  {label} <span className="opacity-60">{counts?.[id] ?? "·"}</span>
                </Chip>
              ))}
            </div>
            <div className="flex gap-2">
              <label className="relative flex-1 lg:w-64">
                <span className="sr-only">Search your cards</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search by title or name" className="h-10 w-full rounded-full border border-line bg-paper pl-9 pr-3 text-[14px] focus:border-burgundy/40 focus:outline-none" />
              </label>
              <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 w-40 rounded-full text-[14px]">
                <option value="updated">Last edited</option>
                <option value="created">Newest</option>
                <option value="title">Title A–Z</option>
              </Select>
            </div>
          </div>

          {error ? (
            <EmptyState title="We couldn't load your cards" description={error} action={<Button onClick={() => load(0)}>Try again</Button>} />
          ) : items === null ? (
            <GridSkeleton />
          ) : items.length === 0 ? (
            counts?.all === 0 && counts.archived === 0 && !query ? (
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
                title={query ? `Nothing matches “${query}”` : filter === "scheduled" ? "Nothing scheduled yet" : filter === "group" ? "No group cards yet" : `No ${filter === "all" ? "" : filter} cards`}
                description={filter === "scheduled" ? "Schedule a card to arrive at the perfect moment — birthdays at midnight, anniversaries at breakfast." : "Cards will appear here as you make them."}
                action={
                  <Button asChild variant="outline">
                    <Link href={filter === "group" ? "/create?experience=together" : "/create"}>Create one</Link>
                  </Button>
                }
              />
            )
          ) : (
            <>
              <motion.ul layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <AnimatePresence initial={false}>
                  {items.map((c) => (
                    <motion.li key={c.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="group flex flex-col rounded-[20px] border border-line bg-paper p-3 shadow-soft">
                      <Link href={`/editor/${c.id}`} className="relative block overflow-hidden rounded-[14px] bg-blush" aria-label={`Edit ${c.title}`}>
                        <div className="mx-auto w-[62%] py-5 transition-transform duration-500 group-hover:scale-[1.03]">
                          <div className="shadow-paper">{c.firstPage && <CardPageView page={c.firstPage} />}</div>
                        </div>
                        <span className="absolute left-2.5 top-2.5 flex gap-1">
                          <Badge tone={statusTone[c.status]} className="capitalize">
                            {c.status}
                          </Badge>
                          {c.isGroup && (
                            <Badge tone="neutral">
                              <Users className="size-3" /> Group
                            </Badge>
                          )}
                          {c.isDisabled && <Badge tone="rose">Link off</Badge>}
                        </span>
                      </Link>
                      <div className="mt-3 px-1">
                        <h3 className="truncate text-[15px] font-medium">{c.title || "Untitled card"}</h3>
                        <p className="mt-0.5 text-[12.5px] text-muted">
                          {occasionMap[c.occasion]?.name ?? "Card"} ·{" "}
                          {c.status === "scheduled" && c.scheduledFor ? `Arrives ${formatDate(c.scheduledFor, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` : `Edited ${now ? timeAgo(c.updatedAt, now) : formatDate(c.updatedAt)}`}
                        </p>
                        {(c.status === "published" || c.viewCount > 0) && (
                          <p className="mt-1 text-[12.5px] text-ink/70">
                            {c.viewCount ? `Opened ${c.viewCount} ${c.viewCount === 1 ? "time" : "times"}${c.lastOpenedAt && now ? ` · last ${timeAgo(c.lastOpenedAt, now)}` : ""}` : "Not opened yet"}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-line px-0.5 pt-2.5">
                        <div className="flex">
                          <IconAction label="Edit" href={`/editor/${c.id}`} icon={PenLine} />
                          <IconAction label="Preview" href={`/card/${c.slug}?preview=${c.id}`} icon={Eye} newTab />
                          <IconAction label="Share & settings" onClick={() => openManage(c)} icon={Share2} />
                          <IconAction label="Responses" onClick={() => setResponsesFor(c)} icon={MessageSquareHeart} />
                          {c.isGroup && <IconAction label="Contributions" onClick={() => setContributionsFor(c)} icon={Users} />}
                        </div>
                        <div className="flex">
                          <IconAction label="Duplicate" onClick={() => act(() => creationService.duplicate(c.id), "Duplicated — find the copy in Drafts.")} icon={Copy} />
                          {c.status === "archived" ? (
                            <IconAction label="Restore" onClick={() => act(() => creationService.unpublish(c.id, false), "Restored to drafts.")} icon={ArchiveRestore} />
                          ) : (
                            <IconAction label="Archive" onClick={() => act(() => creationService.unpublish(c.id, true), "Archived.")} icon={Archive} />
                          )}
                          <IconAction label="Delete" onClick={() => setDeleting(c)} icon={Trash2} danger />
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
              {items.length < total && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    loading={loadingMore}
                    onClick={async () => {
                      setLoadingMore(true);
                      await load(items.length);
                      setLoadingMore(false);
                    }}
                  >
                    Load more ({total - items.length})
                  </Button>
                </div>
              )}
            </>
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
              description={rFilter === "saved" ? "Tap “Keep this card” at the end of any card you receive to save it here." : "Cards you open while signed in gather here, so you can open them again whenever you like."}
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
                        {occasionMap[r.occasion]?.name} · Opened {now ? timeAgo(r.openedAt, now) : formatDate(r.openedAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={r.saved ? "Remove from saved" : "Save card"}
                      aria-pressed={r.saved}
                      onClick={async () => {
                        await receivedService.setSaved(r.slug, !r.saved);
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

      {managing && (
        <ManageCardDialog
          card={managing}
          open={!!managing}
          onOpenChange={(v) => !v && setManaging(null)}
          onChanged={(c) => {
            setManaging(c);
            void load(0);
          }}
        />
      )}
      {responsesFor && <ResponsesDialog card={responsesFor} onClose={() => setResponsesFor(null)} />}
      {contributionsFor && <ContributionsDialog card={contributionsFor} onClose={() => setContributionsFor(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Delete this card?"
        description={`“${deleting?.title}” will be permanently deleted${deleting?.status === "published" ? " and its link will stop working" : ""}, along with its responses and any photos no other card uses. This can't be undone.`}
        confirmLabel="Delete forever"
        destructive
        onConfirm={() => act(() => creationService.remove(deleting!.id), "Deleted.")}
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
    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
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

