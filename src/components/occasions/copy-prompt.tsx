"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";

export function CopyPrompt({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const toast = useToast();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Copy message"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          toast.success("Copied — paste it into your card.");
          setTimeout(() => setDone(false), 1800);
        } catch {
          toast.error("Couldn't access your clipboard.");
        }
      }}
    >
      {done ? <Check /> : <Copy />}
    </Button>
  );
}
