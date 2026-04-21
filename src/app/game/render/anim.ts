import type { Sprite } from "./draw";

export type Anim = {
  frames: Sprite[];
  fps: number;
  loop: boolean;
};

export function animFrame(anim: Anim, timeSec: number) {
  const n = anim.frames.length;
  if (!n) throw new Error("Anim has no frames");
  const f = Math.floor(timeSec * anim.fps);
  if (anim.loop) return anim.frames[f % n];
  return anim.frames[Math.min(n - 1, f)];
}
