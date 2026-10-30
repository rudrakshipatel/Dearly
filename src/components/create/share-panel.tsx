"use client";

import { Check, Copy, Mail, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { absoluteUrl } from "@/lib/utils";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";

export function SharePanel({ path, recipient, label = "Their private link" }: { path: string; recipient?: string; label?: string }) {
  const url = absoluteUrl(path);
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const text = `${recipient ? `${recipient}, ` : ""}I made you a little something 💌`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
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
          <Button variant="outline" size="sm" onClick={() => navigator.share({ title: "A little something from Dearly", text, url }).catch(() => {})}>
            <Share2 /> Share…
          </Button>
        )}
        <Button asChild variant="outline" size="sm">
          <a href={`mailto:?subject=${encodeURIComponent("A little something for you")}&body=${encodeURIComponent(`${text}\n\n${url}`)}`}>
            <Mail /> Email
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle /> WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
}
