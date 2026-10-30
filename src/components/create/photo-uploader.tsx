"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { uploadService } from "@/lib/services";
import { StorageFullError } from "@/lib/services/storage";
import type { Photo } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { PhotoView, sceneNames } from "../art/scene";
import { useToast } from "../ui/toast";

export function PhotoUploader({
  photos,
  onChange,
  max = 12,
  withDetails,
}: {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
  max?: number;
  withDetails?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const toast = useToast();

  const add = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, max - photos.length);
    if (!list.length) {
      toast.info(`You can add up to ${max} photos.`);
      return;
    }
    setBusy(list.length);
    const added: Photo[] = [];
    for (const f of list) {
      try {
        added.push({ id: uid("p-"), src: await uploadService.uploadImage(f, 1200), caption: "" });
      } catch (e) {
        toast.error({ title: "Couldn't add a photo", description: e instanceof Error ? e.message : undefined });
      }
      setBusy((b) => b - 1);
    }
    try {
      onChange([...photos, ...added]);
    } catch (e) {
      if (e instanceof StorageFullError) toast.error(e.message);
    }
  };

  const update = (id: string, patch: Partial<Photo>) => onChange(photos.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <div>
      <div className={cn("grid gap-3", withDetails ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-3 sm:grid-cols-4")}>
        {photos.map((p, i) => (
          <div key={p.id} className={cn("group relative", withDetails && "flex gap-3 rounded-2xl border border-line bg-paper p-2.5")}>
            <div className={cn("relative aspect-square overflow-hidden rounded-xl bg-blush", withDetails ? "w-24 shrink-0" : "w-full")}>
              <PhotoView src={p.src} alt={p.caption || `Photo ${i + 1}`} />
              <button
                type="button"
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => onChange(photos.filter((x) => x.id !== p.id))}
                className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-ink/70 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
            {withDetails && (
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <input
                  aria-label={`Caption for photo ${i + 1}`}
                  value={p.caption ?? ""}
                  onChange={(e) => update(p.id, { caption: e.target.value })}
                  placeholder="Caption"
                  maxLength={60}
                  className="h-9 rounded-lg border border-line bg-ivory px-2.5 font-hand text-lg focus:border-burgundy/40 focus:outline-none"
                />
                <input
                  aria-label={`Date for photo ${i + 1}`}
                  type="date"
                  value={p.date?.slice(0, 10) ?? ""}
                  onChange={(e) => update(p.id, { date: e.target.value })}
                  className="h-9 rounded-lg border border-line bg-ivory px-2.5 text-[13px] text-ink/80 focus:border-burgundy/40 focus:outline-none"
                />
              </div>
            )}
          </div>
        ))}
        {Array.from({ length: busy }).map((_, i) => (
          <div key={`busy-${i}`} className="skeleton grid aspect-square place-items-center rounded-xl">
            <Loader2 className="size-5 animate-spin text-muted" />
          </div>
        ))}
        {photos.length + busy < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              add(e.dataTransfer.files);
            }}
            className={cn(
              "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-[13px] text-muted transition-colors hover:border-burgundy/40 hover:text-burgundy",
              dragOver ? "border-burgundy bg-blush/60" : "border-line bg-paper",
              withDetails && "aspect-auto min-h-28",
            )}
          >
            <ImagePlus className="size-5" />
            Add photos
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && add(e.target.files)} />
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
        <span>No photos handy? Try a sample:</span>
        {sceneNames.slice(0, 5).map((s) => (
          <button
            key={s}
            type="button"
            disabled={photos.length >= max}
            onClick={() => onChange([...photos, { id: uid("p-"), src: `scene:${s}`, caption: s }])}
            className="rounded-full border border-line bg-paper px-2.5 py-0.5 capitalize hover:border-ink/30 disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
