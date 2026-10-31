"use client";

import { Check, Copy, Download, Mail, MessageCircle, QrCode, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { absoluteUrl } from "@/lib/utils";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";

export function SharePanel({ path, recipient, label = "Their private link" }: { path: string; recipient?: string; label?: string }) {
  const url = absoluteUrl(path);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  useEffect(() => {
    if (!showQr || qr) return;
    import("qrcode").then((Q) => Q.toDataURL(url, { margin: 1, width: 360, color: { dark: "#29252A", light: "#FFFFFF" } }).then(setQr));
  }, [showQr, qr, url]);
  const toast = useToast();
  const text = `${recipient ? `${recipient}, ` : ""}I made you a little something 💌`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      track("card_shared", { channel: "copy" });
      setCopied(true);
      toast.success("Link copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the link and copy it manually.");
    }
  };
  return (
    <div>
      <p className="eyebrow mb-2">{label}</p>
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-ivory p-1.5 pl-4">
        <input readOnly value={url} aria-label={label} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 bg-transparent text-[14px] text-ink focus:outline-none" />
        <Button size="sm" onClick={copy}>
          {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button variant="outline" size="sm" onClick={() => navigator.share({ title: "A little something from Dearly", text, url }).then(() => track("card_shared", { channel: "native" })).catch(() => {})}>
            <Share2 /> Share…
          </Button>
        )}
        <Button asChild variant="outline" size="sm">
          <a onClick={() => track("card_shared", { channel: "email" })} href={`mailto:?subject=${encodeURIComponent("A little something for you")}&body=${encodeURIComponent(`${text}\n\n${url}`)}`}>
            <Mail /> Email
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a onClick={() => track("card_shared", { channel: "whatsapp" })} href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle /> WhatsApp
          </a>
        </Button>
        <Button variant="outline" size="sm" aria-expanded={showQr} onClick={() => setShowQr((v) => !v)}>
          <QrCode /> QR code
        </Button>
      </div>
      {showQr && (
        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-line bg-white p-3">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element -- generated data URL
            <img src={qr} alt="QR code for the card link" className="size-36" />
          ) : (
            <div className="skeleton size-36 rounded-lg" />
          )}
          <div className="text-[13px] text-muted">
            <p>Print it inside a real card, or show it on your phone.</p>
            {qr && (
              <a href={qr} download="dearly-card-qr.png" className="mt-2 inline-flex items-center gap-1 text-burgundy underline underline-offset-4">
                <Download className="size-3.5" /> Download PNG
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
