import type { Metadata, Viewport } from "next";
import { Caveat, DM_Sans, Dancing_Script, Instrument_Serif } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], display: "swap" });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], display: "swap" });
const dancing = Dancing_Script({ variable: "--font-dancing", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://dearly.app"),
  title: {
    default: "Dearly — Make someone feel special",
    template: "%s · Dearly",
  },
  description:
    "Create beautiful, personalized digital surprises — interactive letters, gift reveals, memory books and group cards for the people who matter most.",
  openGraph: {
    title: "Dearly — Make someone feel special",
    description: "More than a card. A memory. Interactive digital celebrations made with love.",
    siteName: "Dearly",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF9F5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${instrument.variable} ${dmSans.variable} ${caveat.variable} ${dancing.variable} antialiased`}
    >
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
