"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, Menu, User as UserIcon, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { occasions } from "@/lib/data/occasions";
import { coreExperiences } from "@/lib/data/experiences";
import { useUser } from "@/lib/hooks";
import { authService } from "@/lib/services";
import { cn } from "@/lib/utils";
import { Logo } from "../brand/logo";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";

const links = [
  { href: "/explore", label: "Explore" },
  { href: "/occasions", label: "Occasions", menu: "occasions" as const },
  { href: "/experiences", label: "Experiences", menu: "experiences" as const },
  { href: "/pricing", label: "Pricing" },
];

export function NavbarFallback() {
  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Logo />
      </div>
    </header>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState<"occasions" | "experiences" | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus when the route changes (state adjustment during render, no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
    setMenu(null);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        scrolled ? "bg-ivory/85 shadow-[0_1px_0_var(--color-line)] backdrop-blur-md" : "bg-transparent",
      )}
      onMouseLeave={() => setMenu(null)}
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-8">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <div key={l.href} className="relative" onMouseEnter={() => setMenu(l.menu ?? null)}>
                <Link
                  href={l.href}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[14px] text-ink/75 transition-colors hover:text-ink",
                    active && "text-ink",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {l.label}
                  {l.menu && <ChevronDown className={cn("size-3.5 transition-transform", menu === l.menu && "rotate-180")} />}
                </Link>
                {active && <motion.span layoutId="nav-dot" className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-rose" />}
              </div>
            );
          })}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/dashboard" className="rounded-full px-3.5 py-2 text-[14px] text-ink/75 hover:text-ink">
            My Creations
          </Link>
          {user ? <AccountMenu name={user.name} /> : (
            <>
              <Link href="/sign-in" className="rounded-full px-3.5 py-2 text-[14px] text-ink/75 hover:text-ink">
                Sign in
              </Link>
              <Button asChild size="sm" className="h-9 px-4">
                <Link href="/sign-up">Get started</Link>
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 lg:hidden">
          <Button asChild variant="ghost" size="icon" aria-label={user ? "My account" : "Sign in"}>
            <Link href={user ? "/dashboard" : "/sign-in"}>
              <UserIcon className="!size-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X className="!size-5" /> : <Menu className="!size-5" />}
          </Button>
        </div>
      </div>

      {/* Desktop mega menus */}
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-16 hidden border-y border-line bg-ivory/97 backdrop-blur-md lg:block"
            onMouseEnter={() => setMenu(menu)}
          >
            <div className="mx-auto max-w-[1240px] px-8 py-7">
              {menu === "occasions" ? (
                <div className="grid grid-cols-4 gap-x-8 gap-y-1">
                  {occasions.map((o) => (
                    <Link key={o.slug} href={`/occasions/${o.slug}`} className="group rounded-lg px-2 py-2 hover:bg-blush/60">
                      <span className="block text-[14px] text-ink">{o.name}</span>
                      <span className="block text-[12.5px] text-muted">{o.short}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-6">
                  {coreExperiences.map((e) => (
                    <Link key={e.kind} href={`/experiences#${e.kind}`} className="rounded-xl p-3 hover:bg-blush/60">
                      <span className="font-display text-xl text-ink">{e.name}</span>
                      <span className="mt-1 block text-[13px] leading-snug text-muted">{e.tagline}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-ivory lg:hidden"
          >
            <nav aria-label="Mobile" className="flex flex-col px-5 pb-10 pt-4">
              {[...links, { href: "/dashboard", label: "My Creations" }].map((l, i) => (
                <motion.div key={l.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={l.href} className="flex items-center justify-between border-b border-line py-4 font-display text-[28px] text-ink">
                    {l.label}
                  </Link>
                </motion.div>
              ))}
              <p className="eyebrow mt-8 mb-3">Popular occasions</p>
              <div className="flex flex-wrap gap-2">
                {occasions.slice(0, 8).map((o) => (
                  <Link key={o.slug} href={`/occasions/${o.slug}`} className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-[13px]">
                    {o.name}
                  </Link>
                ))}
              </div>
              <div className="mt-10 flex flex-col gap-2">
                <Button asChild size="lg">
                  <Link href="/create">Create something special</Link>
                </Button>
                {user ? (
                  <SignOutButton />
                ) : (
                  <Button asChild size="lg" variant="outline">
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function SignOutButton() {
  const toast = useToast();
  const router = useRouter();
  return (
    <Button
      size="lg"
      variant="outline"
      onClick={async () => {
        await authService.signOut();
        toast.info("You've been signed out.");
        router.push("/");
      }}
    >
      <LogOut /> Sign out
    </Button>
  );
}

function AccountMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const router = useRouter();
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-line bg-paper py-1 pl-1 pr-3 text-[13px] hover:border-ink/30"
      >
        <span className="grid size-7 place-items-center rounded-full bg-burgundy font-display text-[15px] capitalize text-ivory">{name.slice(0, 1)}</span>
        <span className="max-w-24 truncate capitalize">{name}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 w-48 rounded-2xl border border-line bg-paper p-1.5 shadow-lift">
          {[
            ["/dashboard", "My creations"],
            ["/dashboard?tab=received", "Received cards"],
            ["/pricing", "Plan & billing"],
          ].map(([href, label]) => (
            <Link key={href} role="menuitem" href={href} className="block rounded-xl px-3 py-2 text-[14px] hover:bg-blush/60">
              {label}
            </Link>
          ))}
          <button
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] text-rose-deep hover:bg-blush/60"
            onClick={async () => {
              await authService.signOut();
              toast.info("You've been signed out.");
              router.push("/");
            }}
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
