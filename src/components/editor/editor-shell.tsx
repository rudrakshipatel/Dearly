"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudOff,
  Eye,
  Film,
  Image as ImageIcon,
  Images,
  LayoutTemplate,
  Loader2,
  Music,
  Palette,
  Plus,
  Redo2,
  Send,
  Shapes,
  SlidersHorizontal,
  Sticker,
  Type,
  Undo2,
  Upload,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/lib/hooks";
import type { Creation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Wordmark } from "../brand/logo";
import { CardPageView } from "../card/page-view";
import { ManageCardDialog } from "../card/manage-dialog";
import { ExperiencePlayer } from "../experiences/player";
import { PhoneFrame } from "../templates/phone-frame";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { EditorCanvas } from "./canvas";
import { panelComponents, type PanelId } from "./panels";
import { PropertiesPanel } from "./properties";
import { useEditorStore } from "./store";
import { useAutosave } from "./use-autosave";

const tabs: { id: PanelId; label: string; icon: typeof Type }[] = [
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "text", label: "Text", icon: Type },
  { id: "uploads", label: "Uploads", icon: Upload },
  { id: "photos", label: "Photos", icon: Images },
  { id: "backgrounds", label: "Backgrounds", icon: Palette },
  { id: "stickers", label: "Stickers", icon: Sticker },
  { id: "elements", label: "Elements", icon: Shapes },
  { id: "animations", label: "Animations", icon: Film },
  { id: "audio", label: "Audio", icon: Music },
  { id: "pages", label: "Pages", icon: Layers },
];


export function EditorShell({ initial }: { initial: Creation }) {
  const { state, doc, current, selectedEl, actions, canUndo, canRedo } = useEditorStore(initial);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [tab, setTab] = useState<PanelId>("text");
  const [sheet, setSheet] = useState<PanelId | "props" | null>(null);
  const [preview, setPreview] = useState(false);
  const [publish, setPublish] = useState(false);
  const autosave = useAutosave(doc);
  const save = autosave.status;

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = /INPUT|TEXTAREA|SELECT/.test(target.tagName) || target.isContentEditable;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        if (typing) return;
        e.preventDefault();
        if (e.shiftKey) actions.redo();
        else actions.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        if (typing) return;
        e.preventDefault();
        actions.redo();
        return;
      }
      if (typing || !selectedEl) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        actions.removeElement(selectedEl.id);
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        actions.duplicateElement(selectedEl.id);
      } else if (e.key === "Escape") {
        actions.select(null);
      } else if (e.key === "Enter" && selectedEl.type === "text") {
        e.preventDefault();
        actions.edit(selectedEl.id);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        actions.updateElement(selectedEl.id, { x: selectedEl.x + dx, y: selectedEl.y + dy });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions, selectedEl]);


  const panelProps = { doc, page: current, pageIndex: state.page, selectedId: state.selected, actions };
  const Panel = panelComponents[tab];

  const saveLabel = { saved: "All changes saved", pending: "Unsaved changes", saving: "Saving…", retrying: "Offline — retrying", error: "Not saved", conflict: "Changed elsewhere" }[save];
  const saveIndicator = (
    <span className="flex items-center gap-1.5 text-[12px] text-muted" aria-live="polite" title={autosave.message ?? undefined}>
      {save === "saving" || save === "pending" ? <Loader2 className={cn("size-3.5", save === "saving" && "animate-spin")} /> : save === "saved" ? <Cloud className="size-3.5" /> : <CloudOff className="size-3.5 text-rose-deep" />}
      <span className="hidden sm:inline">{saveLabel}</span>
    </span>
  );

  const banner =
    autosave.restorable ? (
      <div className="flex flex-wrap items-center justify-center gap-3 bg-ink px-4 py-2 text-[13px] text-ivory" role="status">
        Unsaved changes from {new Date(autosave.restorable.savedAt).toLocaleString()} were found on this device.
        <button
          className="underline underline-offset-4"
          onClick={() => {
            const restored = autosave.restorable!.doc;
            actions.update((d) => ({ ...d, pages: restored.pages, photos: restored.photos, interaction: restored.interaction, title: restored.title, message: restored.message }));
            autosave.dismissRestore();
          }}
        >
          Restore them
        </button>
        <button className="opacity-70 hover:opacity-100" onClick={autosave.dismissRestore}>
          Discard
        </button>
      </div>
    ) : save === "conflict" ? (
      <div className="flex flex-wrap items-center justify-center gap-3 bg-rose-deep px-4 py-2 text-[13px] text-white" role="alert">
        This card was changed in another tab or device.
        <button className="underline underline-offset-4" onClick={() => autosave.resolveConflict("theirs")}>
          Load the newer version
        </button>
        <button className="underline underline-offset-4" onClick={() => autosave.resolveConflict("mine")}>
          Keep my version
        </button>
      </div>
    ) : save === "error" ? (
      <div className="flex flex-wrap items-center justify-center gap-3 bg-rose-deep px-4 py-2 text-[13px] text-white" role="alert">
        {autosave.message ?? "We couldn't save your latest change."}
        <button className="underline underline-offset-4" onClick={() => autosave.retryNow()}>
          Try again
        </button>
      </div>
    ) : null;

  const pageNav = (
    <div className="flex items-center justify-center gap-2">
      <Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={state.page === 0} onClick={() => actions.goTo(state.page - 1)}>
        <ChevronLeft />
      </Button>
      <div className="scrollbar-none flex max-w-[60vw] items-center gap-2 overflow-x-auto px-1 py-1">
        {doc.pages.map((pg, i) => (
          <button
            key={pg.id}
            onClick={() => actions.goTo(i)}
            aria-label={`Page ${i + 1}`}
            aria-current={i === state.page ? "page" : undefined}
            className={cn("w-10 shrink-0 overflow-hidden rounded-[4px] ring-offset-2 ring-offset-[#F4EEEA] transition-all", i === state.page ? "ring-2 ring-burgundy" : "opacity-70 hover:opacity-100")}
          >
            <CardPageView page={pg} />
          </button>
        ))}
        <button onClick={() => actions.addPage(state.page)} aria-label="Add page" className="grid aspect-[3/4] w-10 shrink-0 place-items-center rounded-[4px] border border-dashed border-ink/25 text-muted hover:text-ink">
          <Plus className="size-4" />
        </button>
      </div>
      <Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={state.page === doc.pages.length - 1} onClick={() => actions.goTo(state.page + 1)}>
        <ChevronRight />
      </Button>
    </div>
  );

  const dialogs = (
    <>
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent title="Preview" description="Exactly what they'll see. Tap through it." size="md">
          {preview && (
            <PhoneFrame className="max-w-[300px]">
              <ExperiencePlayer creation={doc} compact preview />
            </PhoneFrame>
          )}
          <div className="mt-5 flex justify-center">
            <Button asChild variant="outline" size="sm">
              <Link href={`/card/${doc.slug}?preview=${doc.id}`} target="_blank">
                Open full screen
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ManageCardDialog
        card={doc}
        open={publish}
        onOpenChange={setPublish}
        beforePublish={autosave.flush}
        onChanged={(c) =>
          actions.update(
            (d) => ({ ...d, status: c.status, scheduledFor: c.scheduledFor, publishedAt: c.publishedAt, showBranding: c.showBranding, allowReactions: c.allowReactions, allowResponsePhoto: c.allowResponsePhoto, isDisabled: c.isDisabled, hasPassword: c.hasPassword, recipientEmail: c.recipientEmail, timezone: c.timezone, contributionToken: c.contributionToken }),
            false,
          )
        }
      />
    </>
  );

  if (!desktop) {
    const SheetPanel = sheet && sheet !== "props" ? panelComponents[sheet] : null;
    return (
      <div className="fixed inset-0 flex flex-col bg-[#F4EEEA]">
        {banner}
        <header className="flex h-14 items-center justify-between gap-1 border-b border-line bg-paper px-2">
          <Button asChild variant="ghost" size="icon" aria-label="Back to my creations">
            <Link href="/dashboard">
              <ArrowLeft />
            </Link>
          </Button>
          {saveIndicator}
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" aria-label="Undo" disabled={!canUndo} onClick={actions.undo}>
              <Undo2 />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Redo" disabled={!canRedo} onClick={actions.redo}>
              <Redo2 />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Preview" onClick={() => setPreview(true)}>
              <Eye />
            </Button>
            <Button size="sm" onClick={() => setPublish(true)}>
              Publish
            </Button>
          </div>
        </header>
        <div className="min-h-0 flex-1 p-4">
          <EditorCanvas page={current} selectedId={state.selected} editingId={state.editing} actions={actions} />
        </div>
        <div className="pb-2">{pageNav}</div>
        <nav aria-label="Editor tools" className="scrollbar-none flex gap-1 overflow-x-auto border-t border-line bg-paper px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
          {selectedEl && (
            <button onClick={() => setSheet("props")} className="flex w-16 shrink-0 flex-col items-center gap-1 rounded-xl bg-blush px-1 py-1.5 text-[11px] text-burgundy">
              <SlidersHorizontal className="size-5" /> Edit
            </button>
          )}
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setSheet(t.id)} className="flex w-16 shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] text-ink/75 hover:bg-ink/5">
              <t.icon className="size-5" /> {t.label}
            </button>
          ))}
        </nav>
        <AnimatePresence>
          {sheet && (
            <>
              <motion.div className="fixed inset-0 z-40 bg-ink/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(null)} />
              <motion.div
                role="dialog"
                aria-label={sheet === "props" ? "Edit selection" : tabs.find((t) => t.id === sheet)?.label}
                className="fixed inset-x-0 bottom-0 z-50 max-h-[62dvh] overflow-y-auto rounded-t-3xl bg-paper pb-[max(env(safe-area-inset-bottom),16px)] shadow-2xl"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 38 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.6 }}
                onDragEnd={(_, info) => info.offset.y > 80 && setSheet(null)}
              >
                <div className="sticky top-0 z-10 flex items-center justify-between bg-paper px-4 pb-2 pt-3">
                  <span className="mx-auto h-1 w-10 rounded-full bg-ink/15" />
                </div>
                <div className="flex items-center justify-between px-4 pb-2">
                  <p className="font-display text-xl">{sheet === "props" ? "Edit selection" : tabs.find((t) => t.id === sheet)?.label}</p>
                  <Button size="sm" variant="soft" onClick={() => setSheet(null)}>
                    <Check /> Done
                  </Button>
                </div>
                {sheet === "props" ? (
                  <PropertiesPanel el={selectedEl} page={current} doc={doc} pageIndex={state.page} actions={actions} />
                ) : (
                  <div className="px-4 pb-4">{SheetPanel && <SheetPanel {...panelProps} onDone={() => setSheet(null)} />}</div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {dialogs}
      </div>
    );
  }

  return (
    <div className={cn("fixed inset-0 grid bg-[#F4EEEA]", banner ? "grid-rows-[auto_56px_1fr]" : "grid-rows-[56px_1fr]")}>
      {banner}
      {/* Top toolbar */}
      <header className="flex items-center justify-between gap-4 border-b border-line bg-paper px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" aria-label="Back to my creations" className="flex items-center gap-2">
            <Wordmark className="text-[24px]" />
          </Link>
          <span className="h-5 w-px bg-line" />
          <input
            aria-label="Creation title"
            value={doc.title}
            onChange={(e) => actions.update((d) => ({ ...d, title: e.target.value }), false)}
            className="w-64 min-w-0 truncate rounded-lg bg-transparent px-2 py-1 text-[14px] hover:bg-ink/5 focus:bg-ink/5 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Undo (⌘Z)" title="Undo (⌘Z)" disabled={!canUndo} onClick={actions.undo}>
            <Undo2 />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Redo (⇧⌘Z)" title="Redo (⇧⌘Z)" disabled={!canRedo} onClick={actions.redo}>
            <Redo2 />
          </Button>
          <span className="mx-2">{saveIndicator}</span>
          <Button variant="outline" size="sm" onClick={() => setPreview(true)}>
            <Eye /> Preview
          </Button>
          <Button size="sm" onClick={() => setPublish(true)}>
            <Send /> {doc.status === "published" ? "Share" : "Publish"}
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 grid-cols-[72px_288px_1fr_288px]">
        {/* Left rail */}
        <nav aria-label="Editor tools" className="flex flex-col gap-0.5 overflow-y-auto border-r border-line bg-paper py-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={cn("mx-1.5 flex flex-col items-center gap-1 rounded-xl py-2 text-[10.5px] transition-colors", tab === t.id ? "bg-blush text-burgundy" : "text-ink/65 hover:bg-ink/5 hover:text-ink")}
            >
              <t.icon className="size-[18px]" />
              {t.label}
            </button>
          ))}
        </nav>
        {/* Left panel */}
        <aside className="overflow-y-auto border-r border-line bg-paper p-4" aria-label={tabs.find((t) => t.id === tab)?.label}>
          <Panel {...panelProps} />
        </aside>

        {/* Canvas */}
        <main className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 p-8 pb-4">
            <EditorCanvas page={current} selectedId={state.selected} editingId={state.editing} actions={actions} />
          </div>
          <div className="pb-4">{pageNav}</div>
        </main>

        {/* Properties */}
        <aside className="overflow-y-auto border-l border-line bg-paper" aria-label="Properties">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            {selectedEl ? <ImageIcon className="size-4 text-muted" /> : <Palette className="size-4 text-muted" />}
            <p className="text-[13px] font-medium capitalize">{selectedEl ? `${selectedEl.type === "motif" ? "Illustration" : selectedEl.type} selected` : "Page"}</p>
          </div>
          <PropertiesPanel el={selectedEl} page={current} doc={doc} pageIndex={state.page} actions={actions} />
        </aside>
      </div>
      {dialogs}
    </div>
  );
}
