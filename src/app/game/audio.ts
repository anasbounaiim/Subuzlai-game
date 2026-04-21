"use client";

export type PixelSound =
  | "click"
  | "jump"
  | "shoot"
  | "hurt"
  | "death"
  | "restart"
  | "win"
  | "bossDefeat";

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) audioCtx = new AudioContextClass();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

function blip(
  ctx: AudioContext,
  start: number,
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playPixelSound(sound: PixelSound) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (sound === "click") {
    blip(ctx, now, 560, 0.05, "square", 0.045);
    return;
  }

  if (sound === "jump") {
    blip(ctx, now, 330, 0.07, "square", 0.04);
    blip(ctx, now + 0.035, 520, 0.08, "square", 0.035);
    return;
  }

  if (sound === "shoot") {
    blip(ctx, now, 880, 0.04, "sawtooth", 0.035);
    blip(ctx, now + 0.03, 440, 0.05, "square", 0.025);
    return;
  }

  if (sound === "hurt") {
    blip(ctx, now, 170, 0.1, "square", 0.055);
    blip(ctx, now + 0.055, 110, 0.09, "square", 0.045);
    return;
  }

  if (sound === "death") {
    blip(ctx, now, 220, 0.12, "square", 0.055);
    blip(ctx, now + 0.12, 150, 0.16, "square", 0.05);
    blip(ctx, now + 0.28, 82, 0.22, "square", 0.045);
    return;
  }

  if (sound === "restart") {
    blip(ctx, now, 260, 0.05, "square", 0.04);
    blip(ctx, now + 0.055, 390, 0.06, "square", 0.04);
    return;
  }

  if (sound === "win") {
    [440, 554, 659, 880].forEach((freq, index) => {
      blip(ctx, now + index * 0.08, freq, 0.11, "square", 0.045);
    });
    return;
  }

  if (sound === "bossDefeat") {
    [196, 262, 330, 392, 523, 659, 784].forEach((freq, index) => {
      blip(ctx, now + index * 0.07, freq, 0.14, "square", 0.045);
    });
  }
}
