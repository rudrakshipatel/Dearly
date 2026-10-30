import { palettes } from "@/lib/data/palettes";
import type { Motif, PaletteId } from "@/lib/types";

/** Illustrated motifs drawn in a 200×200 box using a palette. Transparent background. */
export function MotifArt({ motif, palette, className }: { motif: Motif; palette: PaletteId; className?: string }) {
  const p = palettes[palette];
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden role="presentation">
      {renderMotif(motif, p)}
    </svg>
  );
}

type P = (typeof palettes)[PaletteId];

const heartPath = (cx: number, cy: number, s: number) =>
  `M${cx} ${cy + s * 0.9} C ${cx - s * 1.6} ${cy - s * 0.1}, ${cx - s * 0.9} ${cy - s * 1.3}, ${cx} ${cy - s * 0.45} C ${cx + s * 0.9} ${cy - s * 1.3}, ${cx + s * 1.6} ${cy - s * 0.1}, ${cx} ${cy + s * 0.9} Z`;

const star4 = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} Q ${cx + r * 0.18} ${cy - r * 0.18} ${cx + r} ${cy} Q ${cx + r * 0.18} ${cy + r * 0.18} ${cx} ${cy + r} Q ${cx - r * 0.18} ${cy + r * 0.18} ${cx - r} ${cy} Q ${cx - r * 0.18} ${cy - r * 0.18} ${cx} ${cy - r} Z`;

function MiniScene({ x, y, w, h, p, variant = 0 }: { x: number; y: number; w: number; h: number; p: P; variant?: number }) {
  const skies = [p.accent2, p.bg, "#F6D7B0"];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={skies[variant % 3]} />
      <circle cx={x + w * 0.7} cy={y + h * 0.35} r={w * 0.12} fill={p.paper} opacity={0.9} />
      <path d={`M${x} ${y + h} L${x} ${y + h * 0.7} Q ${x + w * 0.3} ${y + h * 0.45} ${x + w * 0.55} ${y + h * 0.68} T ${x + w} ${y + h * 0.6} L ${x + w} ${y + h} Z`} fill={p.accent} opacity={0.75} />
      <path d={`M${x} ${y + h} L${x} ${y + h * 0.85} Q ${x + w * 0.5} ${y + h * 0.7} ${x + w} ${y + h * 0.82} L ${x + w} ${y + h} Z`} fill={p.deep} opacity={0.65} />
    </g>
  );
}

function renderMotif(m: Motif, p: P) {
  switch (m) {
    case "envelope":
      return (
        <g>
          <rect x="38" y="40" width="124" height="86" rx="4" fill={p.paper} transform="rotate(-6 100 80)" />
          <g transform="rotate(-6 100 80)">
            <path d="M48 58 H150 M48 70 H138 M48 82 H144" stroke={p.accent2} strokeWidth="3" strokeLinecap="round" />
          </g>
          <rect x="26" y="78" width="148" height="96" rx="6" fill={p.accent2} />
          <path d="M26 84 L100 134 L174 84" fill="none" stroke={p.deep} strokeOpacity="0.25" strokeWidth="2" />
          <path d="M26 174 L88 124 M174 174 L112 124" stroke={p.deep} strokeOpacity="0.15" strokeWidth="2" />
          <circle cx="100" cy="132" r="17" fill={p.deep} />
          <circle cx="100" cy="132" r="12" fill="none" stroke={p.paper} strokeOpacity="0.35" strokeWidth="1.5" />
          <path d={heartPath(100, 131, 6)} fill={p.paper} opacity="0.85" />
        </g>
      );
    case "gift":
      return (
        <g>
          <rect x="44" y="92" width="112" height="84" rx="4" fill={p.accent} />
          <rect x="36" y="74" width="128" height="26" rx="4" fill={p.accent} />
          <rect x="36" y="94" width="128" height="6" fill={p.deep} opacity="0.12" />
          <rect x="92" y="74" width="16" height="102" fill={p.deep} />
          <path d="M100 74 C 72 40, 50 62, 70 74 Z" fill={p.deep} />
          <path d="M100 74 C 128 40, 150 62, 130 74 Z" fill={p.deep} />
          <circle cx="100" cy="74" r="8" fill={p.deep} />
          <circle cx="60" cy="40" r="4" fill={p.accent2} />
          <rect x="140" y="30" width="7" height="7" fill={p.accent2} transform="rotate(20 143 33)" />
          <path d={star4(158, 60, 9)} fill={p.accent2} />
        </g>
      );
    case "polaroids":
      return (
        <g>
          {[
            { x: 22, y: 50, r: -12, v: 0 },
            { x: 108, y: 42, r: 10, v: 1 },
            { x: 62, y: 86, r: -2, v: 2 },
          ].map((f, i) => (
            <g key={i} transform={`rotate(${f.r} ${f.x + 36} ${f.y + 44})`}>
              <rect x={f.x} y={f.y} width="72" height="88" rx="2" fill={p.paper} stroke={p.ink} strokeOpacity="0.08" />
              <MiniScene x={f.x + 6} y={f.y + 6} w={60} h={58} p={p} variant={f.v} />
            </g>
          ))}
          <rect x="84" y="80" width="34" height="11" fill={p.accent2} opacity="0.85" transform="rotate(-8 100 85)" />
        </g>
      );
    case "balloons":
      return (
        <g>
          {[
            { cx: 70, cy: 72, c: p.accent },
            { cx: 128, cy: 62, c: p.deep },
            { cx: 100, cy: 98, c: p.accent2 },
          ].map((b, i) => (
            <g key={i}>
              <path d={`M${b.cx} ${b.cy + 32} Q ${b.cx + (i - 1) * 8} ${b.cy + 70}, ${100 + (i - 1) * 4} 182`} stroke={p.ink} strokeOpacity="0.35" fill="none" strokeWidth="1.2" />
              <ellipse cx={b.cx} cy={b.cy} rx="26" ry="31" fill={b.c} />
              <path d={`M${b.cx - 4} ${b.cy + 31} L${b.cx + 4} ${b.cy + 31} L${b.cx} ${b.cy + 36} Z`} fill={b.c} />
              <ellipse cx={b.cx - 9} cy={b.cy - 12} rx="5" ry="9" fill="#fff" opacity="0.35" transform={`rotate(-20 ${b.cx - 9} ${b.cy - 12})`} />
            </g>
          ))}
        </g>
      );
    case "scratch":
      return (
        <g>
          <rect x="30" y="46" width="140" height="108" rx="12" fill={p.paper} />
          <rect x="44" y="60" width="112" height="80" rx="8" fill="url(#foil)" />
          <defs>
            <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#D8D2CF" />
              <stop offset="0.5" stopColor="#F5F1EE" />
              <stop offset="1" stopColor="#BDB4B0" />
            </linearGradient>
          </defs>
          <path d="M56 116 C 80 96, 96 128, 120 102 C 132 92, 140 100, 146 92 L 146 132 L 56 132 Z" fill={p.accent2} />
          <path d={heartPath(104, 114, 11)} fill={p.deep} />
          <circle cx="160" cy="150" r="16" fill={p.accent} />
          <circle cx="160" cy="150" r="11" fill="none" stroke={p.paper} strokeOpacity="0.5" />
        </g>
      );
    case "floral":
      return (
        <g>
          <path d="M100 180 C 98 150, 104 130, 100 108" stroke={p.deep} strokeWidth="3" fill="none" opacity="0.6" />
          <path d="M100 150 C 70 140, 64 120, 70 112 C 86 118, 98 132, 100 150 Z" fill="#8FA884" />
          <path d="M101 140 C 128 130, 138 112, 132 104 C 116 110, 104 124, 101 140 Z" fill="#7F9873" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse key={a} cx="100" cy="68" rx="20" ry="30" fill={p.accent2} transform={`rotate(${a} 100 86)`} opacity="0.9" />
          ))}
          {[30, 90, 150, 210, 270, 330].map((a) => (
            <ellipse key={a} cx="100" cy="74" rx="13" ry="18" fill={p.accent} transform={`rotate(${a} 100 86)`} opacity="0.85" />
          ))}
          <circle cx="100" cy="86" r="10" fill={p.deep} opacity="0.75" />
          <circle cx="44" cy="58" r="12" fill={p.accent2} opacity="0.7" />
          <circle cx="160" cy="128" r="9" fill={p.accent} opacity="0.6" />
        </g>
      );
    case "stars":
      return (
        <g>
          <path d="M138 58 A 34 34 0 1 1 96 30 A 26 26 0 1 0 138 58 Z" fill={p.accent} />
          <path d={star4(70, 120, 30)} fill={p.accent} />
          <path d={star4(130, 140, 14)} fill={p.accent2} />
          <path d={star4(46, 60, 10)} fill={p.accent2} />
          <circle cx="160" cy="100" r="3" fill={p.accent} />
          <circle cx="40" cy="160" r="2.5" fill={p.accent} />
          <circle cx="104" cy="176" r="2" fill={p.accent2} />
        </g>
      );
    case "cake":
      return (
        <g>
          <ellipse cx="100" cy="176" rx="74" ry="8" fill={p.ink} opacity="0.08" />
          <rect x="38" y="122" width="124" height="52" rx="8" fill={p.accent} />
          <path d="M38 132 Q 52 146 66 132 T 94 132 T 122 132 T 150 132 T 162 132 L162 126 L38 126 Z" fill={p.paper} />
          <rect x="58" y="84" width="84" height="42" rx="8" fill={p.accent2} />
          <path d="M58 92 Q 72 104 86 92 T 114 92 T 142 92 L142 88 L58 88 Z" fill={p.paper} />
          {[78, 100, 122].map((x, i) => (
            <g key={x}>
              <rect x={x - 3} y="56" width="6" height="30" rx="2" fill={i === 1 ? p.deep : p.paper} stroke={p.deep} strokeOpacity="0.2" />
              <path d={`M${x} 40 C ${x + 7} 48, ${x + 5} 56, ${x} 56 C ${x - 5} 56, ${x - 7} 48, ${x} 40 Z`} fill="#F2B544" />
            </g>
          ))}
          {[52, 70, 90, 110, 130, 148].map((x, i) => (
            <circle key={x} cx={x} cy={152 + (i % 2) * 8} r="3" fill={i % 2 ? p.deep : p.paper} opacity="0.8" />
          ))}
        </g>
      );
    case "hearts":
      return (
        <g>
          <path d={heartPath(100, 104, 46)} fill={p.accent} />
          <path d={heartPath(150, 52, 14)} fill={p.deep} />
          <path d={heartPath(46, 64, 10)} fill={p.accent2} />
          <path d={heartPath(160, 150, 8)} fill={p.accent2} />
          <path d="M70 90 Q 76 72 92 70" stroke="#fff" strokeOpacity="0.5" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      );
    case "tree":
      return (
        <g>
          <rect x="92" y="156" width="16" height="22" fill="#7A4E2D" />
          <path d="M100 30 L150 100 H50 Z" fill="#3D6B4F" />
          <path d="M100 60 L160 136 H40 Z" fill="#335C43" />
          <path d="M100 96 L170 166 H30 Z" fill="#2E4A3D" />
          <path d={star4(100, 28, 13)} fill={p.accent} />
          {[
            [80, 90],
            [122, 108],
            [70, 138],
            [114, 146],
            [140, 152],
            [96, 124],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill={i % 2 ? p.accent : p.accent2} />
          ))}
        </g>
      );
    case "champagne":
      return (
        <g>
          <g transform="rotate(-14 76 120)">
            <path d="M50 70 H102 Q 100 108 76 112 Q 52 108 50 70 Z" fill={p.accent2} opacity="0.9" />
            <path d="M54 80 H98 Q 96 104 76 107 Q 56 104 54 80 Z" fill={p.accent} opacity="0.8" />
            <rect x="74" y="112" width="4" height="46" fill={p.accent2} />
            <rect x="60" y="156" width="32" height="5" rx="2" fill={p.accent2} />
          </g>
          <g transform="rotate(14 124 120)">
            <path d="M98 70 H150 Q 148 108 124 112 Q 100 108 98 70 Z" fill={p.accent2} opacity="0.9" />
            <path d="M102 80 H146 Q 144 104 124 107 Q 104 104 102 80 Z" fill={p.accent} opacity="0.8" />
            <rect x="122" y="112" width="4" height="46" fill={p.accent2} />
            <rect x="108" y="156" width="32" height="5" rx="2" fill={p.accent2} />
          </g>
          {[
            [100, 50, 4],
            [88, 36, 3],
            [112, 30, 2.5],
            [96, 20, 2],
          ].map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill={p.accent} />
          ))}
          <path d={star4(152, 40, 10)} fill={p.accent} />
          <path d={star4(46, 48, 7)} fill={p.accent} />
        </g>
      );
    case "rings":
      return (
        <g>
          <circle cx="82" cy="112" r="38" fill="none" stroke={p.accent} strokeWidth="9" />
          <circle cx="122" cy="112" r="38" fill="none" stroke={p.accent2} strokeWidth="9" />
          <path d="M82 74 A 38 38 0 0 1 120 112" fill="none" stroke={p.accent} strokeWidth="9" />
          <path d="M70 60 L82 46 L94 60 L82 74 Z" fill={p.paper} stroke={p.accent} strokeWidth="2" />
          <path d="M70 60 H94 M82 46 L78 60 L82 74 M82 46 L86 60" stroke={p.accent} strokeWidth="1" opacity="0.6" />
          <path d={star4(150, 56, 9)} fill={p.accent} />
          <path d={star4(44, 160, 6)} fill={p.accent2} />
        </g>
      );
    case "cap":
      return (
        <g>
          <path d="M60 104 V 132 Q 100 152 140 132 V 104 Z" fill={p.ink} />
          <path d="M100 56 L176 88 L100 120 L24 88 Z" fill={p.accent} />
          <path d="M100 88 L150 104 V 140" stroke={p.accent2} strokeWidth="3" fill="none" />
          <rect x="144" y="138" width="12" height="22" rx="3" fill={p.accent2} />
          <circle cx="100" cy="88" r="5" fill={p.accent2} />
          {[30, 60, 150, 170, 44].map((x, i) => (
            <rect key={i} x={x} y={30 + (i * 37) % 120} width="6" height="10" fill={i % 2 ? p.accent2 : p.accent} transform={`rotate(${i * 40} ${x} ${30 + (i * 37) % 120})`} />
          ))}
        </g>
      );
    case "sun":
      return (
        <g>
          {Array.from({ length: 12 }).map((_, i) => (
            <rect key={i} x="97" y="22" width="6" height="22" rx="3" fill={p.accent} transform={`rotate(${i * 30} 100 92)`} />
          ))}
          <circle cx="100" cy="92" r="40" fill={p.accent} />
          <circle cx="100" cy="92" r="30" fill={p.accent2} opacity="0.35" />
          <path d="M60 170 Q 60 146 84 146 Q 90 130 110 132 Q 130 128 136 146 Q 158 146 158 170 Z" fill={p.paper} stroke={p.ink} strokeOpacity="0.08" />
        </g>
      );
    case "botanical":
      return (
        <g>
          <path d="M100 186 C 96 140, 108 96, 100 24" stroke={p.deep} strokeWidth="2.5" fill="none" />
          {Array.from({ length: 7 }).map((_, i) => {
            const y = 40 + i * 20;
            const left = i % 2 === 0;
            return (
              <ellipse
                key={i}
                cx={left ? 82 : 118}
                cy={y}
                rx="20"
                ry="10"
                fill={i % 3 === 0 ? p.accent : p.accent2}
                transform={`rotate(${left ? 28 : -28} ${left ? 82 : 118} ${y})`}
                opacity="0.9"
              />
            );
          })}
          <circle cx="50" cy="150" r="5" fill={p.accent} opacity="0.5" />
          <circle cx="150" cy="60" r="4" fill={p.accent} opacity="0.5" />
        </g>
      );
    case "capsule":
      return (
        <g>
          <rect x="34" y="70" width="132" height="94" rx="6" fill={p.paper} />
          <path d="M34 76 L100 124 L166 76" fill="none" stroke={p.accent} strokeWidth="2" />
          <circle cx="100" cy="66" r="34" fill={p.accent} />
          <circle cx="100" cy="66" r="27" fill={p.bg} />
          <path d="M100 48 V 66 L 112 74" stroke={p.accent} strokeWidth="4" strokeLinecap="round" fill="none" />
          <rect x="88" y="140" width="24" height="18" rx="3" fill={p.accent} />
          <path d="M93 140 V 134 A 7 7 0 0 1 107 134 V 140" stroke={p.accent} strokeWidth="3" fill="none" />
        </g>
      );
    case "film":
      return (
        <g transform="rotate(-8 100 100)">
          <rect x="20" y="58" width="160" height="84" fill={p.ink} />
          {Array.from({ length: 9 }).map((_, i) => (
            <g key={i}>
              <rect x={26 + i * 17.5} y="62" width="8" height="6" rx="1" fill={p.paper} opacity="0.85" />
              <rect x={26 + i * 17.5} y="132" width="8" height="6" rx="1" fill={p.paper} opacity="0.85" />
            </g>
          ))}
          <MiniScene x={28} y={74} w={44} h={52} p={p} variant={0} />
          <MiniScene x={78} y={74} w={44} h={52} p={p} variant={1} />
          <MiniScene x={128} y={74} w={44} h={52} p={p} variant={2} />
        </g>
      );
    case "confetti":
      return (
        <g>
          <path d="M40 176 L80 92 L124 136 Z" fill={p.accent} />
          <path d="M80 92 L124 136" stroke={p.deep} strokeWidth="3" />
          <path d="M52 152 L70 160 M62 128 L88 140" stroke={p.paper} strokeWidth="3" opacity="0.6" />
          {[
            [120, 60, p.deep, 20],
            [150, 90, p.accent2, -30],
            [100, 40, p.accent, 45],
            [160, 50, p.accent, 10],
            [134, 112, p.accent2, 60],
            [90, 70, p.accent2, -20],
            [170, 130, p.deep, 30],
          ].map(([x, y, c, r], i) => (
            <rect key={i} x={x as number} y={y as number} width="10" height="5" rx="1.5" fill={c as string} transform={`rotate(${r} ${x} ${y})`} />
          ))}
          {[
            [140, 30],
            [176, 100],
            [116, 96],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill={i % 2 ? p.accent : p.deep} />
          ))}
          <path d="M108 80 Q 124 60 116 44 M130 120 Q 150 116 164 126" stroke={p.accent} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
  }
}
