/** Browser-side media preparation: compression, thumbnails and metadata, before upload. */

export interface PreparedMedia {
  file: Blob;
  mime: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail?: Blob;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process that image."))), type, quality));
}

async function drawScaled(source: CanvasImageSource, w: number, h: number, max: number, type: string, quality: number) {
  const scale = Math.min(1, max / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return { blob: await canvasToBlob(canvas, type, quality), width: canvas.width, height: canvas.height };
}

/** Images are re-encoded (stripping metadata such as GPS), capped at 2048px, with a 480px thumbnail. */
export async function prepareImage(file: File): Promise<PreparedMedia> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("We couldn't read that image. Try a JPG, PNG or WebP.");
  });
  const keepPng = file.type === "image/png" && file.size < 1.5 * 1024 * 1024;
  const type = keepPng ? "image/png" : "image/jpeg";
  const main = await drawScaled(bitmap, bitmap.width, bitmap.height, 2048, type, 0.85);
  const thumb = await drawScaled(bitmap, bitmap.width, bitmap.height, 480, "image/jpeg", 0.78);
  bitmap.close();
  return { file: main.blob, mime: type, width: main.width, height: main.height, thumbnail: thumb.blob };
}

function loadMedia(el: HTMLVideoElement | HTMLAudioElement, url: string) {
  return new Promise<void>((resolve, reject) => {
    el.preload = "metadata";
    el.onloadedmetadata = () => resolve();
    el.onerror = () => reject(new Error("We couldn't read that file."));
    el.src = url;
  });
}

/** Videos keep their encoding; we read duration/size and capture a poster frame. */
export async function prepareVideo(file: File): Promise<PreparedMedia> {
  const url = URL.createObjectURL(file);
  try {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    await loadMedia(v, url);
    await new Promise<void>((resolve) => {
      v.onseeked = () => resolve();
      v.currentTime = Math.min(1, (v.duration || 1) / 3);
      setTimeout(resolve, 1500);
    });
    let thumbnail: Blob | undefined;
    try {
      thumbnail = (await drawScaled(v, v.videoWidth, v.videoHeight, 640, "image/jpeg", 0.8)).blob;
    } catch {
      thumbnail = undefined;
    }
    return { file, mime: file.type, width: v.videoWidth || undefined, height: v.videoHeight || undefined, duration: Number.isFinite(v.duration) ? v.duration : undefined, thumbnail };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function prepareAudio(file: File): Promise<PreparedMedia> {
  const url = URL.createObjectURL(file);
  try {
    const a = document.createElement("audio");
    await loadMedia(a, url);
    return { file, mime: file.type === "audio/x-m4a" ? "audio/mp4" : file.type, duration: Number.isFinite(a.duration) ? a.duration : undefined };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** PUT to a signed upload URL with progress, cancellation and retry on network failures. */
export function putWithProgress(url: string, body: Blob, mime: string, opts: { onProgress?: (p: number) => void; signal?: AbortSignal } = {}) {
  const attempt = () =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", mime);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.upload.onprogress = (e) => e.lengthComputable && opts.onProgress?.(e.loaded / e.total);
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(Object.assign(new Error(`Upload failed (${xhr.status}).`), { retryable: xhr.status >= 500 })));
      xhr.onerror = () => reject(Object.assign(new Error("Upload interrupted."), { retryable: true }));
      xhr.onabort = () => reject(new DOMException("Upload cancelled.", "AbortError"));
      opts.signal?.addEventListener("abort", () => xhr.abort(), { once: true });
      xhr.send(body);
    });
  return (async () => {
    for (let i = 0; ; i++) {
      try {
        return await attempt();
      } catch (e) {
        const retryable = (e as { retryable?: boolean }).retryable;
        if (!retryable || i >= 2 || opts.signal?.aborted) throw e;
        await new Promise((r) => setTimeout(r, 800 * 2 ** i));
      }
    }
  })();
}
