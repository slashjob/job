"use client";

import { useEffect, useRef, useState } from "react";

import type { Run } from "@/lib/runs";
import { WORKING } from "@/lib/standing";

const PITCH = 880;
const LOUDNESS = 0.2;
const LASTS = 0.6;
const KEPT = "sound";

let speaker: AudioContext | null = null;

function ping() {
  if (!speaker) return;
  const now = speaker.currentTime;
  const tone = speaker.createOscillator();
  const volume = speaker.createGain();
  tone.frequency.setValueAtTime(PITCH, now);
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(LOUDNESS, now + 0.01);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + LASTS);
  tone.connect(volume).connect(speaker.destination);
  tone.start(now);
  tone.stop(now + LASTS);
}

export function usePing(run: Run | null) {
  const working = useRef<string | null>(null);
  const [sounding, setSounding] = useState(true);

  useEffect(() => {
    setSounding(localStorage.getItem(KEPT) !== "off");
  }, []);

  const toggleSound = () => {
    localStorage.setItem(KEPT, sounding ? "off" : "on");
    setSounding(!sounding);
    if (!sounding) ping();
  };

  useEffect(() => {
    const unlock = () => {
      speaker ??= new AudioContext();
      void speaker.resume();
    };
    document.addEventListener("pointerdown", unlock);
    return () => document.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    if (sounding && run && run.id === working.current && run.standing !== WORKING) ping();
    working.current = run?.standing === WORKING ? run.id : null;
  }, [run, sounding]);

  return { sounding, toggleSound };
}
