import type { Palette, PaletteId } from "../types";

export const palettes: Record<PaletteId, Palette> = {
  "rose-cream": { id: "rose-cream", name: "Rose & cream", bg: "#FBE7E4", paper: "#FFF8F3", accent: "#D98286", accent2: "#F3C1BE", ink: "#4A2B33", deep: "#8E3B4C" },
  "burgundy-champagne": { id: "burgundy-champagne", name: "Burgundy & champagne", bg: "#F4E9DA", paper: "#FFFBF4", accent: "#713D50", accent2: "#D9C29A", ink: "#3A1E28", deep: "#5A2A3C" },
  "pastel-party": { id: "pastel-party", name: "Pastel party", bg: "#FDF0E1", paper: "#FFFCF6", accent: "#F28C7E", accent2: "#A8D5C9", ink: "#3D3247", deep: "#7B68C8" },
  "forest-gold": { id: "forest-gold", name: "Forest & gold", bg: "#23392F", paper: "#F8F2E6", accent: "#C9A45C", accent2: "#B6403A", ink: "#1F2E27", deep: "#2E4A3D" },
  "midnight-gold": { id: "midnight-gold", name: "Midnight & gold", bg: "#1B2238", paper: "#F7F1E5", accent: "#D7B46A", accent2: "#E9DCC2", ink: "#151A2B", deep: "#2A3352" },
  "lavender-coral": { id: "lavender-coral", name: "Lavender & coral", bg: "#EDE6F8", paper: "#FCFAFF", accent: "#F0907A", accent2: "#C9B9E8", ink: "#3A3150", deep: "#6C5A9C" },
  "ivory-sage": { id: "ivory-sage", name: "Ivory & sage", bg: "#EEF0E6", paper: "#FFFDF7", accent: "#7F9873", accent2: "#D8C9A8", ink: "#2C3328", deep: "#4F6346" },
  "sky-sunshine": { id: "sky-sunshine", name: "Sky & sunshine", bg: "#E3EEF8", paper: "#FFFDF7", accent: "#F2B544", accent2: "#8DB8E0", ink: "#22344A", deep: "#2F5C8A" },
  terracotta: { id: "terracotta", name: "Terracotta", bg: "#F3E1D3", paper: "#FFF9F2", accent: "#C46A47", accent2: "#E6B993", ink: "#3B2419", deep: "#8A4329" },
  "blush-gold": { id: "blush-gold", name: "Blush & gold", bg: "#FCEBE8", paper: "#FFFAF7", accent: "#C8A165", accent2: "#F2CFCB", ink: "#40292C", deep: "#9C6B5E" },
  "navy-ivory": { id: "navy-ivory", name: "Navy & ivory", bg: "#E8E9EE", paper: "#FFFDF8", accent: "#22325A", accent2: "#C7B48A", ink: "#151C33", deep: "#22325A" },
  "mint-peach": { id: "mint-peach", name: "Mint & peach", bg: "#E4F2EC", paper: "#FFFCF7", accent: "#F4A582", accent2: "#9ED3BE", ink: "#253A33", deep: "#3E7A63" },
  "plum-ink": { id: "plum-ink", name: "Plum & ink", bg: "#EFE4EC", paper: "#FFFAFC", accent: "#7D3C6B", accent2: "#E3B7CF", ink: "#2C1A28", deep: "#5B2650" },
  "lemon-sorbet": { id: "lemon-sorbet", name: "Lemon sorbet", bg: "#FBF4D8", paper: "#FFFEF8", accent: "#E9B949", accent2: "#F5A3A3", ink: "#3A3420", deep: "#B2832A" },
};

export const paletteList = Object.values(palettes);

export function isDarkBg(id: PaletteId) {
  return id === "forest-gold" || id === "midnight-gold";
}

export const swatches = [
  "#29252A", "#713D50", "#B45F66", "#D98286", "#F3C1BE", "#C9B9E8", "#6C5A9C",
  "#22325A", "#2F5C8A", "#8DB8E0", "#3E7A63", "#7F9873", "#C9A45C", "#F2B544",
  "#C46A47", "#F0907A", "#FFF9F5", "#FFFFFF",
];
