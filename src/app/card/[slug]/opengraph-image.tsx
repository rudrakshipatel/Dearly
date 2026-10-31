import { ImageResponse } from "next/og";
import { palettes } from "@/lib/data/palettes";
import type { PaletteId } from "@/lib/types";
import { supabaseAnon } from "@/lib/supabase/server";

export const alt = "A little something for you, made with Dearly";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Link-preview image for shared cards. Uses only non-sensitive details (first names, palette). */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await supabaseAnon().rpc("get_card_share_meta", { p_slug: slug });
  const meta = (data ?? {}) as { recipientName?: string; senderName?: string; palette?: PaletteId };
  const p = palettes[meta.palette ?? "rose-cream"] ?? palettes["rose-cream"];
  const dark = meta.palette === "forest-gold" || meta.palette === "midnight-gold";
  const ink = dark ? p.paper : p.ink;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: p.bg, padding: 64, fontFamily: "Georgia, serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ fontSize: 44, color: ink, display: "flex" }}>
            dearly<span style={{ color: p.accent }}>.</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, color: dark ? p.accent : p.deep, letterSpacing: 4, textTransform: "uppercase", fontFamily: "Helvetica" }}>
              {meta.senderName ? `From ${meta.senderName}` : "A little surprise"}
            </div>
            <div style={{ fontSize: 88, lineHeight: 1.02, color: ink, marginTop: 12, maxWidth: 640 }}>
              {meta.recipientName ? `For ${meta.recipientName}, with love` : "Someone made you something special"}
            </div>
          </div>
          <div style={{ fontSize: 26, color: ink, opacity: 0.7, fontFamily: "Helvetica" }}>Tap to open your surprise</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 420 }}>
          <svg width="380" height="260" viewBox="0 0 380 260">
            <rect x="0" y="0" width="380" height="260" rx="14" fill={p.accent2} />
            <path d="M0 14 L190 150 L380 14" fill={p.accent} />
            <path d="M0 260 L160 130 M380 260 L220 130" stroke={p.deep} strokeOpacity="0.2" strokeWidth="3" />
            <circle cx="190" cy="150" r="30" fill={p.deep} />
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
