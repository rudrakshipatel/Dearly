"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, RotateCcw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { getTemplate } from "@/lib/data/templates";
import { cn, fontClass } from "@/lib/utils";
import { MotifArt } from "../art/motif";
import { Confetti, ExperienceButton, Kicker, Polaroid, StageBackground, isDark, usePalette, type ExperienceProps } from "./shared";

function HiddenCard({ creation, compact, children }: { creation: ExperienceProps["creation"]; compact?: boolean; children?: React.ReactNode }) {
  const p = usePalette(creation);
  return (
    <div className="flex size-full flex-col items-center justify-center p-[8%] text-center" style={{ background: p.paper }}>
      <Sparkles className="mb-2 size-5" style={{ color: p.accent }} />
      <p className={cn("font-hand leading-snug", compact ? "text-xl" : "text-[28px]")} style={{ color: p.ink }}>
        {creation.interaction.hiddenMessage}
      </p>
      {children}
    </div>
  );
}

function Done({ creation, onContinue, label = "Continue" }: { creation: ExperienceProps["creation"]; onContinue: () => void; label?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8">
      <ExperienceButton creation={creation} onClick={onContinue}>
        {label} <ArrowRight className="size-4" />
      </ExperienceButton>
    </motion.div>
  );
}

function Header({ creation, children }: { creation: ExperienceProps["creation"]; children: React.ReactNode }) {
  const p = usePalette(creation);
  return (
    <div className="mb-6 px-6 text-center">
      <p className="eyebrow mb-2" style={{ color: isDark(creation) ? p.accent2 : p.deep }}>
        For {creation.recipientName || "you"}, from {creation.senderName || "someone"}
      </p>
      <Kicker creation={creation}>{children}</Kicker>
    </div>
  );
}

/* ----------------------------------------------------------- Scratch */

function Scratch({ creation, onContinue, compact }: ExperienceProps) {
  const p = usePalette(creation);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);
  const drawing = useRef(false);
  const moves = useRef(0);

  const paint = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const g = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    g.addColorStop(0, "#CFC6C2");
    g.addColorStop(0.45, "#F4EFEC");
    g.addColorStop(0.55, "#E3DBD7");
    g.addColorStop(1, "#B8AEA9");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    for (let i = 0; i < 260; i++) ctx.fillRect((i * 37) % rect.width, (i * 53) % rect.height, 1.5, 1.5);
    ctx.fillStyle = "#6F6466";
    ctx.font = `500 ${compact ? 13 : 15}px var(--font-dm-sans), sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH HERE", rect.width / 2, rect.height / 2 + 5);
  }, [compact]);

  useEffect(() => {
    paint();
  }, [paint]);

  const scratchAt = (e: React.PointerEvent) => {
    const c = canvasRef.current;
    if (!c || done) return;
    const rect = c.getBoundingClientRect();
    const ctx = c.getContext("2d")!;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(e.clientX - rect.left, e.clientY - rect.top, compact ? 16 : 24, 0, Math.PI * 2);
    ctx.fill();
    if (++moves.current % 12 === 0) {
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let clear = 0;
      for (let i = 3; i < data.length; i += 64) if (data[i] === 0) clear++;
      if (clear / (data.length / 64) > 0.5) setDone(true);
    }
  };

  return (
    <StageBackground creation={creation}>
      {done && creation.interaction.confetti && <Confetti colors={[p.accent, p.accent2, p.deep, "#F2B544"]} />}
      <Header creation={creation}>{creation.message}</Header>
      <div className={cn("relative aspect-[4/3] w-[86%] overflow-hidden rounded-[20px] shadow-lift", compact ? "max-w-[300px]" : "max-w-[440px]")}>
        <HiddenCard creation={creation} compact={compact} />
        <motion.canvas
          ref={canvasRef}
          className="absolute inset-0 size-full touch-none"
          style={{ cursor: "grab" }}
          animate={{ opacity: done ? 0 : 1 }}
          transition={{ duration: 0.6 }}
          onPointerDown={(e) => {
            drawing.current = true;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            scratchAt(e);
          }}
          onPointerMove={(e) => drawing.current && scratchAt(e)}
          onPointerUp={() => (drawing.current = false)}
          aria-hidden
        />
      </div>
      {done ? (
        <Done creation={creation} onContinue={onContinue} />
      ) : (
        <button className="mt-6 text-sm underline underline-offset-4 opacity-70 hover:opacity-100" style={{ color: isDark(creation) ? p.paper : p.ink }} onClick={() => setDone(true)}>
          Reveal without scratching
        </button>
      )}
    </StageBackground>
  );
}

/* --------------------------------------------------------------- Tap */

function Tap({ creation, onContinue, compact }: ExperienceProps) {
  const p = usePalette(creation);
  const items = creation.interaction.hiddenMessage.split("|").map((x) => x.trim()).filter(Boolean);
  const multi = items.length > 1;
  const count = multi ? items.length : 6;
  const [open, setOpen] = useState<Set<number>>(new Set());
  const all = open.size >= count;
  const toggle = (i: number) => setOpen((s) => new Set(s).add(i));

  return (
    <StageBackground creation={creation}>
      {all && creation.interaction.confetti && <Confetti colors={[p.accent, p.accent2, p.deep]} count={50} />}
      <Header creation={creation}>{creation.message}</Header>
      {multi ? (
        <div className={cn("grid w-[90%] grid-cols-2 gap-3 sm:grid-cols-3", compact ? "max-w-[320px] gap-2" : "max-w-[560px]")}>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              aria-label={open.has(i) ? item : `Reveal reason ${i + 1}`}
              className="relative aspect-[4/3] [perspective:800px]"
            >
              <motion.div className="relative size-full" style={{ transformStyle: "preserve-3d" }} animate={{ rotateY: open.has(i) ? 180 : 0 }} transition={{ duration: 0.6 }}>
                <div className="absolute inset-0 grid place-items-center rounded-2xl text-white shadow-md [backface-visibility:hidden]" style={{ background: i % 2 ? p.accent : p.deep }}>
                  <span className="font-display text-3xl">{i + 1}</span>
                </div>
                <div
                  className="absolute inset-0 grid place-items-center rounded-2xl p-3 text-center shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]"
                  style={{ background: p.paper, color: p.ink }}
                >
                  <span className={cn("font-hand leading-tight", compact ? "text-base" : "text-xl")}>{item}</span>
                </div>
              </motion.div>
            </button>
          ))}
        </div>
      ) : (
        <div className={cn("relative aspect-[4/3] w-[86%] overflow-hidden rounded-[20px] shadow-lift", compact ? "max-w-[300px]" : "max-w-[440px]")}>
          <HiddenCard creation={creation} compact={compact} />
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.button
                key={i}
                aria-label={`Reveal tile ${i + 1}`}
                onClick={() => toggle(i)}
                className="border border-white/30"
                style={{ background: i % 2 ? p.accent : p.deep }}
                animate={open.has(i) ? { opacity: 0, scale: 0.6, rotate: 10 } : { opacity: 1 }}
                transition={{ duration: 0.35 }}
              />
            ))}
          </div>
        </div>
      )}
      <p className="mt-5 text-sm opacity-70" style={{ color: isDark(creation) ? p.paper : p.ink }}>
        {all ? "You found them all." : `Tap to reveal · ${count - open.size} left`}
      </p>
      {all && <Done creation={creation} onContinue={onContinue} />}
    </StageBackground>
  );
}

/* -------------------------------------------------------------- Flip */

function Flip({ creation, onContinue, compact }: ExperienceProps) {
  const p = usePalette(creation);
  const [flipped, setFlipped] = useState(false);
  const t = getTemplate(creation.templateId);
  const front = creation.photos[0];
  return (
    <StageBackground creation={creation}>
      <Header creation={creation}>{creation.message}</Header>
      <button
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? "Flip the card back" : "Flip the card"}
        className={cn("aspect-[3/4] w-[70%] [perspective:1400px]", compact ? "max-w-[220px]" : "max-w-[320px]")}
      >
        <motion.div className="relative size-full" style={{ transformStyle: "preserve-3d" }} animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}>
          <div className="absolute inset-0 overflow-hidden rounded-[18px] shadow-lift [backface-visibility:hidden]" style={{ background: p.bg }}>
            <div className="paper-grain absolute inset-0" />
            {front ? (
              <div className="flex size-full items-center justify-center p-[10%]">
                <Polaroid photo={front} rotate={-2} className="w-full" />
              </div>
            ) : (
              <div className="flex size-full flex-col items-center justify-center p-[10%]">
                <MotifArt motif={t?.motif ?? "stars"} palette={creation.palette} className="w-[80%]" />
                <p className={cn("mt-2 text-center leading-tight", fontClass[t?.font ?? "display"], compact ? "text-xl" : "text-3xl")} style={{ color: isDark(creation) ? p.paper : p.ink }}>
                  {t?.headline ?? "For you"}
                </p>
              </div>
            )}
          </div>
          <div className="absolute inset-0 overflow-hidden rounded-[18px] shadow-lift [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <HiddenCard creation={creation} compact={compact}>
              {creation.photos[1] && <div className="mt-4 w-1/2"><Polaroid photo={creation.photos[1]} rotate={3} /></div>}
            </HiddenCard>
          </div>
        </motion.div>
      </button>
      {!flipped ? (
        <div className="mt-8">
          <ExperienceButton creation={creation} onClick={() => setFlipped(true)}>
            <RotateCcw className="size-4" /> Flip the card
          </ExperienceButton>
        </div>
      ) : (
        <Done creation={creation} onContinue={onContinue} />
      )}
    </StageBackground>
  );
}

/* ----------------------------------------------------------- Balloon */

function Balloons({ creation, onContinue, compact }: ExperienceProps) {
  const p = usePalette(creation);
  const colors = [p.accent, p.deep, p.accent2, "#F2B544", "#8DB8E0"];
  const [popped, setPopped] = useState<number[]>([]);
  const all = popped.length === colors.length;
  return (
    <StageBackground creation={creation}>
      {all && creation.interaction.confetti && <Confetti colors={colors} />}
      <Header creation={creation}>{all ? "You found it!" : creation.message}</Header>
      <div className={cn("relative w-[92%]", compact ? "h-[220px] max-w-[320px]" : "h-[320px] max-w-[520px]")}>
        <AnimatePresence>
          {all ? (
            <motion.div
              key="msg"
              className="absolute inset-0 m-auto flex h-fit max-w-[420px] flex-col items-center rounded-[22px] bg-white/90 p-6 text-center shadow-lift"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 160, damping: 14 }}
            >
              <p className={cn("font-hand leading-snug text-ink", compact ? "text-xl" : "text-[30px]")}>{creation.interaction.hiddenMessage}</p>
            </motion.div>
          ) : (
            colors.map((c, i) =>
              popped.includes(i) ? (
                <motion.span key={`pop-${i}`} className="absolute" style={{ left: `${8 + i * 18}%`, top: `${20 + (i % 2) * 18}%` }} initial={{ opacity: 1, scale: 0.6 }} animate={{ opacity: 0, scale: 2 }} transition={{ duration: 0.4 }}>
                  <Sparkles className="size-10" style={{ color: c }} />
                </motion.span>
              ) : (
                <motion.button
                  key={i}
                  aria-label={`Pop balloon ${i + 1}`}
                  onClick={() => setPopped((x) => [...x, i])}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${4 + i * 18}%`, top: `${8 + (i % 2) * 18}%` }}
                  animate={{ y: [0, -14, 0], rotate: [-2, 2, -2] }}
                  transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
                  exit={{ scale: 1.4, opacity: 0, transition: { duration: 0.15 } }}
                  whileHover={{ scale: 1.06 }}
                >
                  <span className={cn("relative block rounded-[50%_50%_48%_48%/55%_55%_45%_45%]", compact ? "h-[70px] w-[56px]" : "h-[104px] w-[84px]")} style={{ background: c, boxShadow: "inset -8px -10px 0 rgba(0,0,0,.08)" }}>
                    <span className="absolute left-[22%] top-[16%] h-[26%] w-[16%] rotate-[-20deg] rounded-full bg-white/40" />
                  </span>
                  <span className="h-0 w-0 border-x-[6px] border-b-[8px] border-x-transparent" style={{ borderBottomColor: c }} />
                  <span className={cn("w-px bg-ink/30", compact ? "h-16" : "h-28")} />
                </motion.button>
              ),
            )
          )}
        </AnimatePresence>
      </div>
      <p className="mt-2 text-sm opacity-70" style={{ color: isDark(creation) ? p.paper : p.ink }}>
        {all ? "" : `${colors.length - popped.length} balloons left`}
      </p>
      {all && <Done creation={creation} onContinue={onContinue} />}
    </StageBackground>
  );
}

/* ------------------------------------------------------ Photo reveal */

function PhotoReveal({ creation, onContinue, compact }: ExperienceProps) {
  const p = usePalette(creation);
  const [developing, setDeveloping] = useState(false);
  const [done, setDone] = useState(false);
  const photo = creation.photos[0] ?? { id: "x", src: "scene:sunset", caption: "" };
  return (
    <StageBackground creation={creation}>
      <Header creation={creation}>{creation.message}</Header>
      <motion.div
        className={cn("relative w-[66%]", compact ? "max-w-[200px]" : "max-w-[300px]")}
        animate={developing && !done ? { rotate: [-3, 3, -3, 2, -2] } : { rotate: -2 }}
        transition={developing && !done ? { duration: 0.6, repeat: 3 } : {}}
      >
        <motion.div
          initial={false}
          animate={{ filter: developing ? "brightness(1) blur(0px) sepia(0)" : "brightness(0.18) blur(6px) sepia(1)" }}
          transition={{ duration: developing ? 3.2 : 0.2, ease: "easeInOut" }}
          onAnimationComplete={() => developing && setDone(true)}
        >
          <Polaroid photo={{ ...photo, caption: done ? photo.caption : "" }} />
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {done && (
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("mt-6 max-w-md px-6 text-center font-hand", compact ? "text-xl" : "text-3xl")} style={{ color: isDark(creation) ? p.paper : p.ink }}>
            {creation.interaction.hiddenMessage}
          </motion.p>
        )}
      </AnimatePresence>
      {!developing ? (
        <div className="mt-8">
          <ExperienceButton creation={creation} onClick={() => setDeveloping(true)}>
            Shake to develop
          </ExperienceButton>
        </div>
      ) : done ? (
        <Done creation={creation} onContinue={onContinue} />
      ) : (
        <p className="mt-8 text-sm opacity-70" style={{ color: isDark(creation) ? p.paper : p.ink }}>
          Developing…
        </p>
      )}
    </StageBackground>
  );
}

/* -------------------------------------------------------------- Quiz */

function Quiz({ creation, onContinue, compact }: ExperienceProps) {
  const p = usePalette(creation);
  const s = creation.interaction;
  const options = s.quizOptions?.length ? s.quizOptions : ["Yes", "No"];
  const [picked, setPicked] = useState<number | null>(null);
  const [wrong, setWrong] = useState<number[]>([]);
  const correct = picked !== null && picked === (s.quizAnswer ?? 0);
  return (
    <StageBackground creation={creation}>
      {correct && s.confetti && <Confetti colors={[p.accent, p.accent2, p.deep, "#F2B544"]} />}
      <Header creation={creation}>{creation.message}</Header>
      <div className={cn("w-[90%] rounded-[22px] bg-white/85 shadow-lift backdrop-blur", compact ? "max-w-[300px] p-4" : "max-w-[460px] p-7")}>
        {!correct ? (
          <>
            <p className="eyebrow" style={{ color: p.deep }}>
              Question
            </p>
            <p className={cn("mt-2 font-display leading-tight text-ink", compact ? "text-xl" : "text-[28px]")}>{s.quizQuestion}</p>
            <div className="mt-5 flex flex-col gap-2">
              {options.map((o, i) => (
                <motion.button
                  key={i}
                  onClick={() => {
                    setPicked(i);
                    if (i !== (s.quizAnswer ?? 0)) setWrong((w) => [...w, i]);
                  }}
                  disabled={wrong.includes(i)}
                  animate={picked === i && wrong.includes(i) ? { x: [0, -8, 8, -5, 5, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-[15px] transition-colors",
                    wrong.includes(i) ? "border-rose/40 bg-blush/60 text-ink/40 line-through" : "border-line bg-white hover:border-ink/30",
                  )}
                >
                  {o}
                </motion.button>
              ))}
            </div>
            {wrong.length > 0 && <p className="mt-3 text-sm text-rose-deep">Not quite — try again.</p>}
          </>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="mx-auto mb-3 grid size-11 place-items-center rounded-full text-white" style={{ background: p.deep }}>
              <Check className="size-5" />
            </div>
            <p className={cn("font-hand leading-snug text-ink", compact ? "text-xl" : "text-[30px]")}>{s.hiddenMessage}</p>
          </motion.div>
        )}
      </div>
      {correct && <Done creation={creation} onContinue={onContinue} />}
    </StageBackground>
  );
}

export function RevealExperience(props: ExperienceProps) {
  switch (props.creation.interaction.mode) {
    case "tap":
      return <Tap {...props} />;
    case "flip":
      return <Flip {...props} />;
    case "balloon":
      return <Balloons {...props} />;
    case "photo-reveal":
      return <PhotoReveal {...props} />;
    case "quiz":
      return <Quiz {...props} />;
    default:
      return <Scratch {...props} />;
  }
}
