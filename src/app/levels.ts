import raw from "./levels.json";
import type { Level } from "./game/engine/types";

type LevelsFile = { levels: Level[] };
const data = raw as unknown as LevelsFile;

export function getLevelCount() {
  return data.levels.length;
}

export function getLevel(levelId1Based: number): Level {
  const lvl = data.levels[levelId1Based - 1];
  if (!lvl) throw new Error(`Level ${levelId1Based} not found`);
  return lvl;
}
