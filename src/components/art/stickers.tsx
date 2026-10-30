import {
  Cake,
  Camera,
  Coffee,
  Crown,
  Feather,
  Flower2,
  Gem,
  Gift,
  Heart,
  Leaf,
  Moon,
  Music,
  PartyPopper,
  Plane,
  Smile,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  TreePine,
  type LucideIcon,
} from "lucide-react";

export const stickers: Record<string, { label: string; Icon: LucideIcon; fill: boolean }> = {
  heart: { label: "Heart", Icon: Heart, fill: true },
  star: { label: "Star", Icon: Star, fill: true },
  sparkles: { label: "Sparkles", Icon: Sparkles, fill: true },
  flower: { label: "Flower", Icon: Flower2, fill: false },
  cake: { label: "Cake", Icon: Cake, fill: false },
  gift: { label: "Gift", Icon: Gift, fill: false },
  moon: { label: "Moon", Icon: Moon, fill: true },
  sun: { label: "Sun", Icon: Sun, fill: false },
  leaf: { label: "Leaf", Icon: Leaf, fill: true },
  crown: { label: "Crown", Icon: Crown, fill: true },
  party: { label: "Party", Icon: PartyPopper, fill: false },
  music: { label: "Music", Icon: Music, fill: false },
  camera: { label: "Camera", Icon: Camera, fill: false },
  coffee: { label: "Coffee", Icon: Coffee, fill: false },
  plane: { label: "Plane", Icon: Plane, fill: false },
  tree: { label: "Tree", Icon: TreePine, fill: false },
  snowflake: { label: "Snowflake", Icon: Snowflake, fill: false },
  gem: { label: "Gem", Icon: Gem, fill: false },
  feather: { label: "Feather", Icon: Feather, fill: false },
  smile: { label: "Smile", Icon: Smile, fill: false },
};

export function StickerArt({ sticker, color, className }: { sticker: string; color: string; className?: string }) {
  const s = stickers[sticker] ?? stickers.heart;
  return <s.Icon className={className} color={color} fill={s.fill ? color : "none"} strokeWidth={s.fill ? 1.2 : 1.6} aria-label={s.label} />;
}
