import type { Metadata } from "next";
import { LegalPage } from "@/components/info/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="31 October 2026"
      sections={[
        { h: "What we collect", p: ["When you create an account we collect your name and email. When you make a card we store the words, photos, audio and video you add so we can show it to the person you send it to.", "Recipients don't need an account. When a card is opened we record that it was opened, and any reaction the recipient chooses to send."] },
        { h: "How we use it", p: ["We use your information to provide Dearly: saving your creations, delivering cards, sending reminders you ask for and supporting you when you contact us. We never sell your personal information."] },
        { h: "Who can see your cards", p: ["Cards are private by default and only viewable by people who have the link. Links are long and unguessable, and you can delete a card at any time, which stops its link working."] },
        { h: "Your choices", p: ["You can download or delete your data at any time from your account, unsubscribe from emails with one click, and contact us with any privacy question."] },
        { h: "Where we operate", p: ["Dearly serves people in the US, UK, Canada, Australia, New Zealand, India and beyond. We follow the privacy laws that apply where you live, including GDPR, UK GDPR, CCPA and India's DPDP Act."] },
      ]}
    />
  );
}
