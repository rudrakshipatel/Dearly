import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · Dearly" }, robots: { index: false, follow: false } };

const nav = [
  ["/admin", "Overview"],
  ["/admin/templates", "Templates"],
  ["/admin/occasions", "Occasions"],
  ["/admin/users", "Users"],
  ["/admin/moderation", "Moderation"],
];

/** Access is checked on every admin page (server-side) — this layout only provides chrome. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ivory">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5">
          <Link href="/" className="flex items-center gap-2">
            <Wordmark className="text-[22px]" />
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] uppercase tracking-widest text-ivory">Admin</span>
          </Link>
          <nav className="scrollbar-none flex gap-1 overflow-x-auto" aria-label="Admin">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-full px-3 py-1.5 text-[13px] text-ink/75 hover:bg-ink/5 hover:text-ink">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
