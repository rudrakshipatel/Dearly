/* Illustrated "photographs" used as placeholder imagery (no external assets needed). */
import { cn } from "@/lib/utils";

export type SceneName = "sunset" | "beach" | "mountains" | "city" | "picnic" | "meadow" | "lake" | "night";

const scenes: Record<SceneName, React.ReactNode> = {
  sunset: (
    <>
      <defs>
        <linearGradient id="s-sunset" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7B7A3" />
          <stop offset="0.6" stopColor="#FBD9B5" />
          <stop offset="1" stopColor="#FCE8D2" />
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill="url(#s-sunset)" />
      <circle cx="150" cy="170" r="54" fill="#F49A7B" />
      <path d="M0 190 Q 80 150 150 186 T 300 176 V300 H0Z" fill="#C9786E" />
      <path d="M0 226 Q 100 196 190 228 T 300 220 V300 H0Z" fill="#8E4F55" />
      <path d="M0 262 Q 120 240 300 262 V300 H0Z" fill="#5E3442" />
    </>
  ),
  beach: (
    <>
      <rect width="300" height="300" fill="#BFE0EC" />
      <circle cx="232" cy="70" r="26" fill="#FFF3C9" />
      <rect y="150" width="300" height="70" fill="#6FB3C9" />
      <path d="M0 160 Q 40 154 80 160 T 160 160 T 240 160 T 300 160" stroke="#fff" strokeOpacity=".6" strokeWidth="3" fill="none" />
      <path d="M0 210 Q 150 186 300 214 V300 H0Z" fill="#F2DDB5" />
      <path d="M70 250 L 74 180" stroke="#7A5A3A" strokeWidth="3" />
      <path d="M30 186 Q 74 150 120 186 Z" fill="#E87F72" />
      <path d="M52 186 Q 74 158 96 186" fill="#F6C1B5" />
    </>
  ),
  mountains: (
    <>
      <rect width="300" height="300" fill="#DCE8F2" />
      <circle cx="80" cy="74" r="22" fill="#fff" opacity=".9" />
      <path d="M-10 230 L 90 90 L 150 170 L 210 80 L 320 230Z" fill="#8A9DB5" />
      <path d="M90 90 L 110 118 L 96 114 L 80 124Z M210 80 L 230 110 L 214 104 L 198 116Z" fill="#fff" />
      <path d="M0 230 Q 150 190 300 226 V300 H0Z" fill="#7F9873" />
      <path d="M0 262 Q 160 236 300 260 V300 H0Z" fill="#4F6346" />
    </>
  ),
  city: (
    <>
      <rect width="300" height="300" fill="#F3C6B8" />
      <rect y="120" width="300" height="180" fill="#E9A99A" opacity=".4" />
      {[
        [10, 140, 40, 160],
        [56, 100, 36, 200],
        [98, 150, 50, 150],
        [154, 80, 34, 220],
        [194, 130, 46, 170],
        [246, 110, 44, 190],
      ].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill={i % 2 ? "#6E4A5C" : "#87596B"} />
          {Array.from({ length: 6 }).map((_, j) => (
            <rect key={j} x={x + 6 + (j % 2) * (w / 2 - 2)} y={y + 12 + Math.floor(j / 2) * 22} width="8" height="10" fill="#FCD9A8" opacity={j % 3 ? 0.9 : 0.3} />
          ))}
        </g>
      ))}
      <rect y="268" width="300" height="32" fill="#4A2F3C" />
    </>
  ),
  picnic: (
    <>
      <rect width="300" height="300" fill="#CFE7D8" />
      <circle cx="60" cy="60" r="40" fill="#A8CFA0" />
      <circle cx="96" cy="44" r="34" fill="#93C08C" />
      <rect x="70" y="80" width="8" height="70" fill="#7A5A3A" />
      <path d="M0 150 Q 150 130 300 150 V300 H0Z" fill="#9CC48C" />
      <path d="M60 200 L 250 180 L 280 270 L 40 290Z" fill="#F2F0EA" />
      <path d="M60 200 L 250 180 M 100 196 L 120 286 M 150 190 L 170 282 M 200 186 L 220 276 M 52 245 L 266 226" stroke="#E07A75" strokeWidth="9" opacity=".75" />
      <circle cx="140" cy="216" r="14" fill="#E07A75" />
      <rect x="180" y="200" width="30" height="22" rx="4" fill="#F2B544" />
    </>
  ),
  meadow: (
    <>
      <rect width="300" height="300" fill="#FBEFD8" />
      <circle cx="210" cy="90" r="34" fill="#F6CB7A" />
      <path d="M0 170 Q 150 140 300 176 V300 H0Z" fill="#C8D8A6" />
      <path d="M0 220 Q 150 196 300 222 V300 H0Z" fill="#A9BD86" />
      {Array.from({ length: 22 }).map((_, i) => (
        <circle key={i} cx={(i * 47) % 300} cy={200 + ((i * 29) % 90)} r="4" fill={["#E89AA0", "#FFFFFF", "#F2B544"][i % 3]} />
      ))}
    </>
  ),
  lake: (
    <>
      <rect width="300" height="300" fill="#E7E1F3" />
      <circle cx="150" cy="96" r="30" fill="#FFF2DE" />
      <path d="M0 150 L 60 96 L 110 140 L 170 86 L 240 140 L 300 110 V160 H0Z" fill="#9C8FBF" />
      <rect y="160" width="300" height="140" fill="#B7C9E3" />
      <path d="M0 160 L 60 214 L 110 170 L 170 224 L 240 170 L 300 200 V160 H0Z" fill="#9C8FBF" opacity=".35" />
      <path d="M90 230 H 210 M120 250 H 180" stroke="#fff" strokeOpacity=".6" strokeWidth="3" />
    </>
  ),
  night: (
    <>
      <rect width="300" height="300" fill="#1B2238" />
      {Array.from({ length: 30 }).map((_, i) => (
        <circle key={i} cx={(i * 71) % 300} cy={(i * 43) % 180} r={i % 4 ? 1.2 : 2} fill="#F7F1E5" />
      ))}
      <circle cx="220" cy="70" r="24" fill="#F7F1E5" />
      <circle cx="230" cy="64" r="22" fill="#1B2238" />
      <path d="M0 220 Q 150 180 300 222 V300 H0Z" fill="#2A3352" />
    </>
  ),
};

export const sceneNames = Object.keys(scenes) as SceneName[];

export function Scene({ name, className }: { name: string; className?: string }) {
  const key = (name in scenes ? name : "sunset") as SceneName;
  return (
    <svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" className={cn("block size-full", className)} role="img" aria-label={`Illustrated ${key} photo`}>
      {scenes[key]}
    </svg>
  );
}

export { PhotoView } from "./photo";
