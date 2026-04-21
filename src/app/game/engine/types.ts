export type Rect = { x: number; y: number; w: number; h: number };

export type Actor = Rect & {
  vx: number;
  vy: number;
  grounded: boolean;
  facing: 1 | -1;

  dashCD: number;
  dashT: number;

  muzzleT: number;
  hp: number;
  
  shieldT: number;
  shieldCD: number;

  supportIdx?: number | null;
};

export type Bullet = Rect & {
  id: string;
  vx: number;
  vy: number;
  alive: boolean;
  dir: 1 | -1;
  from: "player" | "enemy";
};

export type BossState = "idle" | "patrol" | "telegraph" | "dash" | "slam" | "shoot";

export type Boss = Rect & {
  id: string;

  vx: number;
  vy: number;
  grounded: boolean;

  minX: number;
  maxX: number;
  moveSpeed: number;

  maxHp: number;
  hp: number;
  alive: boolean;

  state?: BossState;
  stateT: number;
  attackIndex?: number;

  shootRate: number;
  shootT: number;
  shootSpeed: number;

  phase: 1 | 2 | 3;
  invulnT: number;
  summonT: number;

  [k: string]: any;
};

export type Enemy = Rect & {
  id: string;
  vx: number;
  vy: number;
  alive: boolean;
  hp: number;
  minX: number;
  maxX: number;

  grounded?: boolean;
  jumpCD?: number;
  jumpPower?: number;

  flying?: boolean;
  baseY?: number;
  amp?: number;
  freq?: number;
  phase?: number;

  maxHp?: number;

  [k: string]: any;
};

export type LaserDir = "h" | "v";

export type Laser = Rect & {
  id: string;
  dir: LaserDir;

  onFor: number;
  offFor: number;

  t: number;
  on: boolean;

  controlledBy?: string;
  invert?: boolean;
};

export type Platform = Rect;
export type SpikeDir = "up" | "down" | "left" | "right";
export type Spike = Rect & {
  dir?: SpikeDir;
};

export type Box = Rect & {
  id: string;
  vx: number;
  vy: number;
  grounded: boolean;
  supportIdx?: number | null;
};

export type Switch = Rect & {
  id: string;
  pressed: boolean;
};

export type Door = Rect & {
  id: string;
  open: boolean;
};

export type Trampoline = Rect & {
  id: string;
  power: number;
  bounceT?: number;
};

export type Coin = Rect & {
  id: string;
  collected: boolean;
};

export type Cannon = Rect & {
  id: string;
  dir: 1 | -1;
  rate: number;
  speed: number;
  t: number;
  enabled: boolean;
  w?: number;
  h?: number;
};

export type MovingPlatform = Rect & {
  id: string;

  x0: number;
  y0: number;
  x1: number;
  y1: number;

  speed: number;
  t: number;
  dir: 1 | -1;

  dx: number;
  dy: number;
  vx: number;
  vy: number;
};

export type Level = {
  name?: string;
  platforms: Platform[];
  enemies: Enemy[];
  boxes: Box[];
  switches: Switch[];
  door: Door;
  trampolines: Trampoline[];
  spikes: Spike[];
  coins: Coin[];
  movingPlatforms: MovingPlatform[];
  lasers?: Laser[];
  cannons?: Cannon[];
  boss?: Boss;
};

export type InputState = {
  left: boolean;
  right: boolean;
  jump: boolean;

  shoot: boolean;
  dash: boolean;
  defend: boolean;
};

export type UIState = {
  tip?: string;
  score?: number;
  coins?: number;
  totalCoins?: number;
  keys?: number;
  deaths?: number;
};

export type EngineEvents = {
  onUI: (ui: {
    hp: number;
    enemiesLeft: number;
    doorOpen: boolean;
    coins: number;
    coinsTotal: number;
  }) => void;
  onLose?: () => void;
  onWin?: () => void;
  onBossDefeated?: () => void;
};
