"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};
const hasSpeech = () => "speechSynthesis" in window;

/** Liest Frage, Antworten und Erklärung mit der Sprachausgabe des Geräts vor (Web Speech API). */
export function ReadAloud({ text, lang = "de-DE" }: { text: string; lang?: string }) {
  const [speaking, setSpeaking] = useState(false);
  const supported = useSyncExternalStore(subscribeNoop, hasSpeech, () => false);
  const utter = useRef<SpeechSynthesisUtterance | null>(null);
  useEffect(() => () => { if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  if (!supported) return null;
  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = 0.95;
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
    if (voice) u.voice = voice;
    u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false);
    utter.current = u; synth.cancel(); synth.speak(u); setSpeaking(true);
  };
  return <button type="button" onClick={toggle} aria-pressed={speaking} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-ink-300 bg-surface px-3 text-xs text-ink-700" title="Frage und Antworten vorlesen"><span aria-hidden="true">{speaking ? "■" : "🔊"}</span>{speaking ? "Stopp" : "Vorlesen"}</button>;
}
