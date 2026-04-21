import type { Sprite } from "./draw";

export const TILE = 32;

export function cellCat(cx: number, cy: number, w = 1, h = 1): Sprite {
  return { sx: cx * 48, sy: cy * 48, sw: w * 48, sh: h * 48 };
}

export function cellTile(cx: number, cy: number, w = 1, h = 1): Sprite {
  return { sx: cx * 32, sy: cy * 32, sw: w * 32, sh: h * 32 };
}

export function rectObj(sx: number, sy: number, sw: number, sh: number): Sprite {
  return { sx, sy, sw, sh };
}

export const CHARS = {
  // Player - Cat
  player_idle: cellCat(0, 0),
  player_run1: cellCat(0, 4),
  player_run2: cellCat(1, 4),
  player_jump: cellCat(2, 4),
  player_fall: cellCat(4, 4),
  player_dash: cellCat(5, 4),

  // Enemy - Different cat animation
  enemy_ground: cellCat(0, 1),
  enemy_fly1: cellCat(2, 1),
  enemy_fly2: cellCat(3, 1),

  // Coin
  coin1: cellTile(0, 7),
  coin2: cellTile(1, 7),
  coin3: cellTile(2, 7),

  // Bullets
  bullet_player: cellTile(3, 7),
  bullet_enemy: cellTile(4, 7),

  // Boss
  boss: cellCat(0, 3, 2, 2),

  // HUD
  heart_full: cellTile(5, 7),
  heart_empty: cellTile(6, 7),
} as const;

export const WORLD = {
  // Tiles
  tile_brick: cellTile(1, 0),
  tile_ground: cellTile(2, 0),

  // Spikes (use something else from tiles for now)
  spike_up: cellTile(3, 0),
  spike_down: cellTile(3, 0),
  spike_left: cellTile(3, 0),
  spike_right: cellTile(3, 0),

  // Door (from Objects)
  door_closed: rectObj(600, 180, 64, 64),
  door_open: rectObj(664, 180, 64, 64),

  // Box 
  box: rectObj(500, 150, 48, 48),

  // Devices
  trampoline: rectObj(10, 10, 48, 48),
  cannon: rectObj(80, 10, 48, 48),

  laser_on: rectObj(150, 10, 32, 32),
  laser_off: rectObj(190, 10, 32, 32),

  switch_off: rectObj(230, 10, 32, 32),
  switch_on: rectObj(270, 10, 32, 32),
} as const;
