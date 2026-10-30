"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InteractionSettings } from "../types";
import { useMediaSrc } from ".";

const melodies: Record<"music-box" | "soft-piano", { notes: number[]; wave: OscillatorType; step: number; decay: number }> = {
  // MIDI note numbers — a gentle lullaby-like loop.
  "music-box": { notes: [76, 79, 84, 79, 81, 84, 88, 84, 76, 79, 83, 79, 81, 79, 76, 72], wave: "triangle", step: 0.42, decay: 1.4 },
  "soft-piano": { notes: [60, 67, 72, 76, 65, 72, 77, 81, 62, 69, 74, 77, 67, 74, 79, 83], wave: "sine", step: 0.55, decay: 2.2 },
};

const freq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/**
 * Plays background sound only after an explicit user action.
 * Built-in tracks are synthesised with Web Audio, so no audio files are needed.
 */
export function useAmbientSound(sound: InteractionSettings["sound"], audioSrc?: string) {
  const [playing, setPlaying] = useState(false);
  const ctx = useRef<AudioContext | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const custom = useMediaSrc(sound === "custom" ? audioSrc : undefined);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    ctx.current?.close().catch(() => {});
    ctx.current = null;
    audio.current?.pause();
    setPlaying(false);
  }, []);

  const start = useCallback(() => {
    if (sound === "none") return;
    if (sound === "custom") {
      if (!custom) return;
      audio.current ??= new Audio(custom);
      audio.current.loop = true;
      audio.current.volume = 0.6;
      audio.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      return;
    }
    const m = melodies[sound];
    const ac = new AudioContext();
    ctx.current = ac;
    const master = ac.createGain();
    master.gain.value = 0.08;
    master.connect(ac.destination);
    let i = 0;
    const play = () => {
      const t = ac.currentTime;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = m.wave;
      o.frequency.value = freq(m.notes[i % m.notes.length]);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(1, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + m.decay);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + m.decay + 0.05);
      i++;
    };
    play();
    timer.current = setInterval(play, m.step * 1000);
    setPlaying(true);
  }, [sound, custom]);

  useEffect(() => stop, [stop]);

  return {
    available: sound !== "none" && (sound !== "custom" || !!custom),
    playing,
    toggle: () => (playing ? stop() : start()),
  };
}
