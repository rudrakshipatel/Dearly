"use client";

import { CalendarClock, Eye, EyeOff, Lock, Send, Unlock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { z } from "zod";
import { refreshSession } from "@/lib/hooks";
import { ApiClientError, creationService } from "@/lib/services";
import { formatInZone, timezones, userTimezone, zonedLocalToUtc } from "@/lib/time";
import type { Creation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SharePanel } from "../create/share-panel";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Input, Label, Select, Switch } from "../ui/form";
import { Badge } from "../ui/misc";
import { useToast } from "../ui/toast";

/**
 * Publishing & sharing controls for a saved card: publish, schedule, republish, unpublish,
 * disable access, password, responses and branding — all enforced server-side.
 */
export function ManageCardDialog({
  card,
  open,
  onOpenChange,
  onChanged,
  beforePublish,
}: {
  card: Creation;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged: (c: Creation) => void;
  /** Flush unsaved edits before publishing (editor). */
  beforePublish?: () => Promise<boolean>;
}) {
  const toast = useToast();
  const router = useRouter();
  const live = card.status === "published" || card.status === "scheduled";
  const [mode, setMode] = useState<"now" | "later">(card.status === "scheduled" ? "later" : "now");
  const [date, setDate] = useState("");
  const [tz, setTz] = useState(card.timezone ?? userTimezone());
  const [email, setEmail] = useState(card.recipientEmail ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const zones = useMemo(() => timezones(), []);

  const fail = (e: unknown, title: string) => {
    const upgrade = e instanceof ApiClientError && e.isEntitlement;
    toast.error({
      title: upgrade ? "That needs an upgrade" : title,
      description: e instanceof Error ? e.message : undefined,
      action: upgrade ? { label: "See plans", onClick: () => router.push("/pricing") } : undefined,
    });
  };

  const run = async (key: string, fn: () => Promise<Creation | void>, ok?: string) => {
    setBusy(key);
    try {
      const c = await fn();
      if (c) onChanged(c);
      if (ok) toast.success(ok);
    } catch (e) {
      fail(e, "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const publish = () =>
    run("publish", async () => {
      if (beforePublish && !(await beforePublish())) throw new Error("Your latest changes haven't saved yet. Try again in a moment.");
      if (email && !z.string().email().safeParse(email).success) throw new Error("That recipient email doesn't look right.");
      let scheduledAt: string | null = null;
      if (mode === "later") {
        if (!date) throw new Error("Choose a delivery date and time.");
        scheduledAt = zonedLocalToUtc(date, tz);
      }
      const res = await creationService.publish(card.id, { scheduledAt, timezone: tz, deliveryEmail: email.trim() || null });
      if (res.delivery && !res.delivery.queued) toast.info({ title: "Delivery saved", description: res.delivery.reason });
      void refreshSession();
      return res.card;
    }, mode === "later" ? "Scheduled." : live ? "Republished with your latest changes." : "Published! Your link is ready.");

  const setting = (key: string, s: Parameters<typeof creationService.updateSettings>[1], ok: string) => run(key, () => creationService.updateSettings(card.id, s), ok);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={live ? "Share & settings" : "Publish your card"} description={live ? (card.status === "scheduled" ? `Scheduled for ${card.scheduledFor ? formatInZone(card.scheduledFor, card.timezone ?? userTimezone()) : "later"}.` : "It's live. Changes you save appear for your recipient right away.") : `Get a private link for ${card.recipientName || "them"} — no account needed to open it.`} size="lg">
        <div className="space-y-6">
          {card.disabledReason && <p className="rounded-xl bg-blush px-4 py-3 text-[14px] text-rose-deep">Disabled by moderators: {card.disabledReason}</p>}

          {live && !card.isDisabled && <SharePanel path={`/card/${card.slug}`} recipient={card.recipientName} />}
          {live && card.isDisabled && <p className="rounded-xl bg-ink/5 px-4 py-3 text-[14px]">Access is turned off — the link shows “not found” until you turn it back on.</p>}

          <section className="space-y-3 rounded-2xl border border-line p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {(["now", "later"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={cn("rounded-xl border p-3 text-left text-[14px]", mode === m ? "border-burgundy bg-blush/60" : "border-line")}>
                  <span className="flex items-center gap-2 font-medium">
                    {m === "now" ? <Send className="size-4" /> : <CalendarClock className="size-4" />} {m === "now" ? (live ? "Live now" : "Publish now") : "Schedule"} {m === "later" && <Badge tone="premium">Pro</Badge>}
                  </span>
                </button>
              ))}
            </div>
            {mode === "later" && (
              <div className="grid gap-2 sm:grid-cols-2">
                <Input type="datetime-local" aria-label="Delivery date and time" value={date} onChange={(e) => setDate(e.target.value)} />
                <Select aria-label="Timezone" value={tz} onChange={(e) => setTz(e.target.value)}>
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="mc-email">Email it to the recipient (optional)</Label>
              <Input id="mc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maya@example.com" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={publish} loading={busy === "publish"}>
                <Send /> {mode === "later" ? (card.status === "scheduled" ? "Reschedule" : "Schedule") : live ? "Republish" : "Publish & get link"}
              </Button>
              {live && (
                <Button variant="outline" loading={busy === "unpublish"} onClick={() => run("unpublish", () => creationService.unpublish(card.id), card.status === "scheduled" ? "Delivery cancelled; back to draft." : "Unpublished — the link no longer works.")}>
                  {card.status === "scheduled" ? "Cancel delivery" : "Unpublish"}
                </Button>
              )}
              <Button asChild variant="ghost">
                <Link href={`/card/${card.slug}?preview=${card.id}`} target="_blank">
                  <Eye /> Preview
                </Link>
              </Button>
            </div>
          </section>

          <section className="grid gap-4 rounded-2xl border border-line p-4 sm:grid-cols-2">
            <ToggleRow label="Allow reactions & replies" checked={card.allowReactions !== false} busy={busy === "reactions"} onChange={(v) => setting("reactions", { allowReactions: v }, v ? "Replies on." : "Replies off.")} />
            <ToggleRow label="Let them reply with a photo" checked={!!card.allowResponsePhoto} busy={busy === "photo"} onChange={(v) => setting("photo", { allowResponsePhoto: v }, v ? "Photo replies on." : "Photo replies off.")} />
            <ToggleRow label={<>Show Dearly branding <Badge tone="premium">Premium to remove</Badge></>} checked={card.showBranding} busy={busy === "branding"} onChange={(v) => setting("branding", { showBranding: v }, "Saved.")} />
            {live && <ToggleRow label="Link is open" checked={!card.isDisabled} busy={busy === "access"} onChange={(v) => setting("access", { isDisabled: !v }, v ? "Access turned back on." : "Access turned off.")} />}
          </section>

          <section className="rounded-2xl border border-line p-4">
            <Label htmlFor="mc-pw">
              <span className="flex items-center gap-1.5">{card.hasPassword ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />} Password protection {card.hasPassword && <Badge tone="rose">On</Badge>}</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              <Input id="mc-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={card.hasPassword ? "Set a new password" : "4–72 characters"} className="max-w-xs" autoComplete="new-password" />
              <Button
                variant="outline"
                disabled={password.length < 4}
                loading={busy === "pw"}
                onClick={() =>
                  run("pw", async () => {
                    await creationService.setPassword(card.id, password);
                    setPassword("");
                    return { ...card, hasPassword: true };
                  }, "Password set. Share it separately from the link.")
                }
              >
                Set password
              </Button>
              {card.hasPassword && (
                <Button variant="ghost" loading={busy === "pwoff"} onClick={() => run("pwoff", async () => (await creationService.setPassword(card.id, null), { ...card, hasPassword: false }), "Password removed.")}>
                  <EyeOff /> Remove
                </Button>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({ label, checked, onChange, busy }: { label: React.ReactNode; checked: boolean; onChange: (v: boolean) => void; busy?: boolean }) {
  return (
    <label className={cn("flex items-center justify-between gap-3 text-[14px]", busy && "opacity-60")}>
      <span className="flex items-center gap-2">{label}</span>
      <Switch checked={checked} onChange={(v) => !busy && onChange(v)} label={typeof label === "string" ? label : "Setting"} />
    </label>
  );
}
