"use client";

import { Download, ExternalLink, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { analyticsAvailable, getConsent, setConsent, subscribeConsent } from "@/lib/analytics";
import { formatBytes } from "@/lib/entitlements";
import { refreshSession, useSession } from "@/lib/hooks";
import { authService, billingService } from "@/lib/services";
import { userTimezone, timezones } from "@/lib/time";
import { formatDate } from "@/lib/utils";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../ui/dialog";
import { Field, Input, Select, Switch } from "../ui/form";
import { Badge, Container, Skeleton } from "../ui/misc";
import { useToast } from "../ui/toast";

export function AccountPage() {
  const { me, status } = useSession();
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const consent = useSyncExternalStore(subscribeConsent, getConsent, () => null);
  const awaitingPayment = params.get("checkout") === "success";

  // After checkout, poll until the verified webhook has updated the plan.
  useEffect(() => {
    if (!awaitingPayment) return;
    let n = 0;
    const t = setInterval(() => {
      n++;
      void refreshSession();
      if (n > 20) clearInterval(t);
    }, 3000);
    return () => clearInterval(t);
  }, [awaitingPayment]);

  if (status === "loading" || !me) {
    return (
      <Container className="pt-12">
        <Skeleton className="h-14 w-72" />
        <Skeleton className="mt-8 h-64 w-full" />
      </Container>
    );
  }

  const sub = me.subscription;
  const usage = [
    ["Live cards", `${me.usage.liveCards} of ${me.limits.maxLiveCards}`],
    ["Storage", `${formatBytes(me.usage.storageBytes)} of ${formatBytes(me.limits.storageBytes)}`],
    ["AI generations this month", me.limits.aiGenerationsPerMonth ? `${me.usage.aiThisMonth} of ${me.limits.aiGenerationsPerMonth}` : "Pro feature"],
    ["Photos per card", String(me.limits.maxPhotosPerCard)],
  ];

  return (
    <Container className="max-w-4xl pb-24 pt-8 sm:pt-12">
      <p className="eyebrow mb-3">Account</p>
      <h1 className="font-display text-5xl leading-none">Your account</h1>
      <p className="mt-3 text-muted">{me.user.email}</p>

      {awaitingPayment && (
        <p className="mt-6 flex items-center gap-2 rounded-2xl bg-blush px-4 py-3 text-[14px] text-burgundy" role="status">
          <Loader2 className="size-4 animate-spin" /> Thank you! We&apos;re confirming your payment with the provider — your plan updates here automatically.
        </p>
      )}

      <section className="mt-10 rounded-[22px] border border-line bg-paper p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-3xl">
            Plan: <span className="capitalize">{me.plan}</span>
          </h2>
          {sub && <Badge tone={sub.status === "active" ? "free" : "rose"}>{sub.cancel_at_period_end ? "Ends" : sub.status}{sub.current_period_end ? ` · ${formatDate(sub.current_period_end)}` : ""}</Badge>}
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-4">
          {usage.map(([k, v]) => (
            <div key={k}>
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-1 text-[15px]">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          {me.plan === "free" ? (
            <Button asChild>
              <Link href="/pricing">Upgrade</Link>
            </Button>
          ) : (
            sub && (
              <>
                {sub.provider === "stripe" && (
                  <Button variant="outline" loading={busy === "portal"} onClick={async () => {
                    setBusy("portal");
                    try {
                      await billingService.portal();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Couldn't open billing.");
                      setBusy(null);
                    }
                  }}>
                    <ExternalLink /> Invoices & payment method
                  </Button>
                )}
                {!sub.cancel_at_period_end && sub.status !== "canceled" && (
                  <Button variant="ghost" loading={busy === "cancel"} onClick={async () => {
                    setBusy("cancel");
                    try {
                      const r = await billingService.cancel();
                      toast.success(r.message);
                      setTimeout(() => refreshSession(), 3000);
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Couldn't cancel.");
                    } finally {
                      setBusy(null);
                    }
                  }}>
                    Cancel subscription
                  </Button>
                )}
              </>
            )
          )}
        </div>
      </section>

      <ProfileForm key={me.user.id} initialName={me.profile?.display_name ?? ""} initialTz={me.profile?.timezone ?? userTimezone()} />
      <section className="mt-6 rounded-[22px] border border-line bg-paper p-6">
        <h2 className="font-display text-3xl">Privacy & data</h2>
        {analyticsAvailable() && (
          <label className="mt-5 flex items-center justify-between gap-4 text-[14px]">
            <span>
              Product analytics
              <span className="block text-[12.5px] text-muted">Anonymous usage events only — never your messages, names or photos.</span>
            </span>
            <Switch checked={consent === "granted"} onChange={(v) => setConsent(v ? "granted" : "denied")} label="Product analytics" />
          </label>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/api/me/export" download>
              <Download /> Download my data
            </a>
          </Button>
          <Button variant="ghost" className="text-rose-deep" onClick={() => setDeleting(true)}>
            <Trash2 /> Delete my account
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete your account?"
        description="This permanently deletes your account, every card you've made (their links stop working), your uploads and your history. Active subscriptions should be cancelled first. This can't be undone."
        confirmLabel="Delete everything"
        destructive
        onConfirm={async () => {
          if (confirmText !== "DELETE") {
            toast.error("Type DELETE in the box first.");
            return false;
          }
          try {
            await authService.deleteAccount();
            await authService.signOut();
            toast.success("Your account has been deleted.");
            router.replace("/");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't delete your account.");
            return false;
          }
        }}
      >
        <Input aria-label="Type DELETE to confirm" placeholder="Type DELETE to confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="mb-4" />
      </ConfirmDialog>
    </Container>
  );
}

function ProfileForm({ initialName, initialTz }: { initialName: string; initialTz: string }) {
  const [name, setName] = useState(initialName);
  const [tz, setTz] = useState(initialTz);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <section className="mt-6 rounded-[22px] border border-line bg-paper p-6">
      <h2 className="font-display text-3xl">Profile</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Display name" htmlFor="dn">
          <Input id="dn" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </Field>
        <Field label="Timezone (for scheduling)" htmlFor="tz">
          <Select id="tz" value={tz} onChange={(e) => setTz(e.target.value)}>
            {timezones().map((z) => (
              <option key={z} value={z}>
                {z.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Button
        className="mt-4"
        loading={busy}
        disabled={!name.trim()}
        onClick={async () => {
          setBusy(true);
          try {
            await authService.updateProfile({ display_name: name.trim(), timezone: tz });
            await refreshSession();
            toast.success("Saved.");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't save.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Save profile
      </Button>
    </section>
  );
}
