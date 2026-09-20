"use client";
import { useEffect, useRef } from "react";

/** Prüft die Darstellungseinstellungen des Nutzers (html-Attribute aus users.accessibility). */
export function motionAllowed(): boolean {
  if (typeof document === "undefined") return false;
  if (document.documentElement.getAttribute("data-motion") === "reduced") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
export function soundAllowed(): boolean { return typeof document !== "undefined" && document.documentElement.getAttribute("data-sound") !== "off"; }

/** Kurzer, freundlicher Erfolgston ohne Audiodatei (Web Audio). */
export function playSuccessTone(kind: "correct" | "finish" = "correct") {
  if (!soundAllowed()) return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const notes = kind === "finish" ? [523.25, 659.25, 783.99, 1046.5] : [659.25, 880];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      const t0 = ctx.currentTime + i * 0.11;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + 0.25);
    });
    setTimeout(() => void ctx.close(), 1200);
  } catch { /* kein Ton verfügbar */ }
}

/** Konfetti über der Seite für rund zwei Sekunden; respektiert "weniger Bewegung". */
export function Confetti({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active || !motionAllowed()) return;
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = window.innerWidth * dpr; canvas.height = window.innerHeight * dpr; ctx.scale(dpr, dpr);
    const colors = ["#1d4ed8", "#f6c700", "#1f9d55", "#e8850c", "#c1121f", "#7c3aed"];
    const parts = Array.from({ length: 140 }, () => ({ x: Math.random() * window.innerWidth, y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3, r: 4 + Math.random() * 5, c: colors[Math.floor(Math.random() * colors.length)]!, a: Math.random() * Math.PI, va: (Math.random() - 0.5) * 0.3 }));
    let frame = 0; let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const p of parts) { p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6); ctx.restore(); }
      if (++frame < 150) raf = requestAnimationFrame(draw); else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);
  if (!active) return null;
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 h-full w-full" />;
}
