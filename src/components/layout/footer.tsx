import Link from "next/link";
import { occasions } from "@/lib/data/occasions";
import { Wordmark } from "../brand/logo";
import { NewsletterForm } from "./newsletter-form";

const columns = [
  {
    title: "Dearly",
    links: [
      { href: "/about", label: "About Dearly" },
      { href: "/pricing", label: "Pricing" },
      { href: "/contact", label: "Contact" },
      { href: "/help", label: "Help Center" },
    ],
  },
  {
    title: "Make",
    links: [
      { href: "/create", label: "Create a card" },
      { href: "/explore", label: "Explore templates" },
      { href: "/experiences", label: "Experiences" },
      { href: "/together/DemoGroupCardHappyBirthdayLeo2026", label: "Group cards" },
    ],
  },
  {
    title: "Occasions",
    links: occasions.slice(0, 5).map((o) => ({ href: `/occasions/${o.slug}`, label: o.name })),
  },
];

const social = [
  { href: "https://www.instagram.com/", label: "Instagram" },
  { href: "https://www.pinterest.com/", label: "Pinterest" },
  { href: "https://www.tiktok.com/", label: "TikTok" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-paper">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.3fr_2fr]">
        <div className="max-w-sm">
          <Wordmark className="text-[34px]" />
          <p className="mt-3 text-[15px] leading-relaxed text-muted">A little something, made with love. Interactive cards, letters and memories for the people who matter.</p>
          <NewsletterForm />
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((c) => (
            <div key={c.title}>
              <p className="eyebrow mb-4">{c.title}</p>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[14px] text-ink/75 transition-colors hover:text-burgundy">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="eyebrow mb-4">Follow</p>
            <ul className="space-y-2.5">
              {social.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-[14px] text-ink/75 transition-colors hover:text-burgundy">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© 2026 Dearly. Made with love, everywhere.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-ink">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms of Service
            </Link>
            <Link href="/help" className="hover:text-ink">
              Help
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
