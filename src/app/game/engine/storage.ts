import { STORAGE_KEY } from "./constants";

/**
 * Returns the highest unlocked level.
 * Always >= 1
 */
export function loadUnlockedMax(): number {
  if (typeof window === "undefined") return 1;

  const raw = localStorage.getItem(STORAGE_KEY);
  const value = Number(raw);

  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

/**
 * Saves the highest unlocked level.
 * Ignores invalid values.
 */
export function saveUnlockedMax(level: number) {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(level) || level < 1) return;

  localStorage.setItem(STORAGE_KEY, String(Math.floor(level)));
}
