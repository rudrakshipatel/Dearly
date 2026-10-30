import type { Metadata } from "next";
import { LegalPage } from "@/components/info/legal";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="31 October 2026"
      sections={[
        { h: "Using Dearly", p: ["You can use Dearly to create and share personal greetings and experiences. Please be kind: don't use Dearly to harass, deceive or harm anyone, or to share content you don't have the right to share."] },
        { h: "Your content", p: ["You own the words, photos and media you add. You give us permission to store and display them only so we can deliver your cards to the people you choose."] },
        { h: "Plans and payments", p: ["Free features are free forever. Paid plans renew automatically until cancelled, and you can cancel at any time. Cards you've already sent stay live after cancellation."] },
        { h: "Availability", p: ["We work hard to keep Dearly running smoothly, but we can't promise it will never be interrupted. We'll always give notice before making significant changes to these terms."] },
      ]}
    />
  );
}
