"use client";

import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  className,
  children,
  title,
  description,
  hideTitle,
  size = "md",
  ...props
}: React.ComponentProps<typeof D.Content> & {
  title: string;
  description?: string;
  hideTitle?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] data-[state=open]:animate-[fadeIn_200ms_ease]" />
      <D.Content
        className={cn(
          "fixed z-50 flex max-h-[92dvh] w-full flex-col overflow-hidden bg-paper shadow-2xl focus:outline-none",
          "inset-x-0 bottom-0 rounded-t-3xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
          "data-[state=open]:animate-[sheetIn_260ms_cubic-bezier(.2,.8,.2,1)]",
          { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-3xl", xl: "sm:max-w-5xl" }[size],
          className,
        )}
        {...props}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-ink/15 sm:hidden" aria-hidden />
        <div className={cn("flex items-start justify-between gap-4 px-6 pt-5", hideTitle && "sr-only")}>
          <div>
            <D.Title className="font-display text-2xl leading-tight text-ink">{title}</D.Title>
            {description ? (
              <D.Description className="mt-1 text-sm text-muted">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">{title}</D.Description>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">{children}</div>
        <D.Close asChild>
          <Button variant="ghost" size="icon-sm" className="absolute right-3 top-3 bg-paper/80" aria-label="Close">
            <X />
          </Button>
        </D.Close>
      </D.Content>
    </D.Portal>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
}) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description} size="sm">
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "rose" : "primary"}
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onOpenChange(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
