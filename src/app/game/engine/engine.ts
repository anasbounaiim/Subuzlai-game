import { PHYS, W, H } from "./constants";
import type {
  Actor,
  Bullet,
  Box,
  Enemy,
  EngineEvents,
  InputState,
  Level,
  Rect,
  Spike,
  MovingPlatform,
} from "./types";
import { getLevel } from "../../levels";

const EPS = 0.0001;
const TRAMPOLINE_FRAME_ASPECT = 496 / (2200 / 3);

function aabb(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function spikeHitbox(s: Spike): Rect {
  const dir = s.dir ?? (s.h > s.w ? "left" : "up");

  if (dir === "down") {
    return {
      x: s.x + 2,
      y: s.y + Math.max(0, s.h - 14),
      w: Math.max(0, s.w - 4),
      h: Math.min(14, s.h),
    };
  }

  if (dir === "left") {
    return {
      x: s.x + Math.max(0, s.w - 14),
      y: s.y + 2,
      w: Math.min(14, s.w),
      h: Math.max(0, s.h - 4),
    };
  }

  if (dir === "right") {
    return {
      x: s.x,
      y: s.y + 2,
      w: Math.min(14, s.w),
      h: Math.max(0, s.h - 4),
    };
  }

  return {
    x: s.x + 2,
    y: s.y,
    w: Math.max(0, s.w - 4),
    h: Math.min(14, s.h),
  };
}

function laserHitbox(l: { x: number; y: number; w: number; h: number; dir: "h" | "v" }): Rect {
  if (l.dir === "h") {
    return {
      x: l.x + 16,
      y: l.y,
      w: Math.max(0, l.w - 32),
      h: l.h,
    };
  }

  const beamY = l.y + 16;
  const beamH = Math.max(0, l.h - 32);
  const beamW = l.w;
  const aspectW = Math.max(8, Math.round((139 / 681) * beamH));
  const drawW = Math.min(beamW, aspectW);
  const drawX = l.x + Math.floor((beamW - drawW) * 0.5);

  return {
    x: drawX,
    y: beamY,
    w: drawW,
    h: beamH,
  };
}

function trampolineHitbox(t: Rect): Rect {
  const drawW = Math.max(t.w + 14, Math.round(t.w * 1.18));
  const drawH = Math.round(drawW * TRAMPOLINE_FRAME_ASPECT);
  const drawX = t.x + (t.w - drawW) * 0.5;
  const drawY = t.y + t.h - drawH - 35;

  return {
    x: drawX + drawW * 0.12,
    y: drawY + drawH * 0.22,
    w: drawW * 0.76,
    h: Math.max(10, drawH * 0.18),
  };
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function approach(cur: number, target: number, maxDelta: number) {
  const d = target - cur;
  if (Math.abs(d) <= maxDelta) return target;
  return cur + Math.sign(d) * maxDelta;
}

function resolveX(entity: Rect, prevX: number, solids: Rect[]) {
  for (const s of solids) {
    if (!aabb(entity, s)) continue;

    if (entity.x > prevX) entity.x = s.x - entity.w - EPS;
    else if (entity.x < prevX) entity.x = s.x + s.w + EPS;
  }
}

function resolveY(
  entity: { x: number; y: number; w: number; h: number; vy: number; grounded: boolean },
  prevY: number,
  solids: Rect[]
) {
  entity.grounded = false;

  for (const s of solids) {
    if (!aabb(entity as Rect, s)) continue;

    if (entity.y > prevY) {
      entity.y = s.y - entity.h - EPS;
      entity.vy = 0;
      entity.grounded = true;
    } else if (entity.y < prevY) {
      entity.y = s.y + s.h + EPS;
      entity.vy = 0;
    }
  }
}

function tryMoveBoxX(box: Box, dx: number, solids: Rect[]) {
  const startX = box.x;
  const prevX = box.x;
  box.x += dx;
  resolveX(box, prevX, solids);
  return box.x - startX;
}

function resolvePlayerBox(
  player: any,
  box: Box,
  solids: Rect[],
  prevPX: number,
  prevPY: number,
  tryingToJump: boolean
) {
  if (!aabb(player, box)) return;

  const penLeft = player.x + player.w - box.x;
  const penRight = box.x + box.w - player.x;
  const penUp = player.y + player.h - box.y;
  const penDown = box.y + box.h - player.y;

  const minX = Math.min(penLeft, penRight);
  const minY = Math.min(penUp, penDown);

  const wasAbove = prevPY + player.h <= box.y + 6;
  if (wasAbove && player.vy >= 0 && penUp > 0) {
    player.y = box.y - player.h - EPS;
    player.vy = 0;
    player.grounded = true;
    return;
  }

  if (tryingToJump) {
    if (minY <= minX) {
      if (penUp < penDown) {
        player.y = box.y - player.h - EPS;
        if (player.vy > 0) player.vy = 0;
      } else {
        player.y = box.y + box.h + EPS;
        if (player.vy < 0) player.vy = 0;
      }
    }
    return;
  }

  const pushingRight = player.vx > 0;
  const pushingLeft = player.vx < 0;

  if (minX < minY) {
    if (pushingRight) {
      const want = penLeft + EPS;
      const moved = tryMoveBoxX(box, want, solids);

      player.x = box.x - player.w - EPS;

      if (moved < want - 0.5) player.vx = 0;

      resolveX(player, prevPX, solids);
      return;
    }

    if (pushingLeft) {
      const want = -(penRight + EPS);
      const moved = tryMoveBoxX(box, want, solids);

      player.x = box.x + box.w + EPS;

      if (moved > want + 0.5) player.vx = 0;

      resolveX(player, prevPX, solids);
      return;
    }

    if (penLeft < penRight) player.x = box.x - player.w - EPS;
    else player.x = box.x + box.w + EPS;

    resolveX(player, prevPX, solids);
    return;
  }

  if (penUp < penDown) {
    player.y = box.y - player.h - EPS;
    if (player.vy > 0) player.vy = 0;
  } else {
    player.y = box.y + box.h + EPS;
    if (player.vy < 0) player.vy = 0;
  }
}

type Coin = Rect & { id: string; collected: boolean };

function ensureCoins(lvl: any) {
  if (!lvl.coins) lvl.coins = [];
  for (const c of lvl.coins as Coin[]) {
    if (typeof c.collected !== "boolean") c.collected = false;
  }
}

function ensureLasers(lvl: any) {
  if (!lvl.lasers) lvl.lasers = [];
  for (const l of lvl.lasers) {
    if (typeof l.onFor !== "number") l.onFor = 1;
    if (typeof l.offFor !== "number") l.offFor = 1;
    if (typeof l.t !== "number") l.t = 0;
    if (typeof l.on !== "boolean") l.on = true;
    if (typeof l.invert !== "boolean") l.invert = false;
  }
}

function ensureCannons(lvl: any) {
  if (!lvl.cannons) lvl.cannons = [];
  for (const c of lvl.cannons) {
    if (c.dir !== 1 && c.dir !== -1) c.dir = 1;
    if (typeof c.rate !== "number") c.rate = 1.0;
    if (typeof c.speed !== "number") c.speed = 360;
    if (typeof c.t !== "number") c.t = 0;
    if (typeof c.fireT !== "number") c.fireT = 0;
    if (typeof c.enabled !== "boolean") c.enabled = true;
    if (typeof c.w !== "number") c.w = 42;
    if (typeof c.h !== "number") c.h = 42;
  }
}

function ensureTrampolines(lvl: any) {
  if (!lvl.trampolines) lvl.trampolines = [];
  for (const t of lvl.trampolines) {
    if (typeof t.bounceT !== "number") t.bounceT = 0;
  }
}

function ensureMovingPlatforms(lvl: any) {
  if (!lvl.movingPlatforms) lvl.movingPlatforms = [];
  for (const mp of lvl.movingPlatforms as MovingPlatform[]) {
    if (typeof mp.t !== "number") mp.t = 0;
    if (mp.dir !== 1 && mp.dir !== -1) mp.dir = 1;
    if (typeof mp.speed !== "number") mp.speed = 120;

    if (typeof mp.x0 !== "number") mp.x0 = mp.x;
    if (typeof mp.y0 !== "number") mp.y0 = mp.y;
    if (typeof mp.x1 !== "number") mp.x1 = mp.x;
    if (typeof mp.y1 !== "number") mp.y1 = mp.y;

    if (typeof mp.dx !== "number") mp.dx = 0;
    if (typeof mp.dy !== "number") mp.dy = 0;

    if (typeof mp.vx !== "number") mp.vx = 0;
    if (typeof mp.vy !== "number") mp.vy = 0;
  }
}

function ensureEnemies(lvl: any) {
  if (!lvl.enemies) lvl.enemies = [];
  for (const e of lvl.enemies as any[]) {
    if (typeof e.hp !== "number") e.hp = 1;
    if (typeof e.maxHp !== "number") e.maxHp = e.hp;
    if (typeof e.flying !== "boolean") e.flying = false;
    if (typeof e.shootT !== "number") e.shootT = Math.random() * 1.4;
    if (typeof e.shootRate !== "number") e.shootRate = 2.6;
    if (typeof e.shootRange !== "number") e.shootRange = 380;
    if (typeof e.shootSpeed !== "number") e.shootSpeed = 260;

    if (e.flying) {
      if (typeof e.baseY !== "number") e.baseY = e.y;
      if (typeof e.amp !== "number") e.amp = 18;
      if (typeof e.freq !== "number") e.freq = 1.2;
      if (typeof e.phase !== "number") e.phase = 0;
      e.vy = 0;
    } else {
      if (typeof e.grounded !== "boolean") e.grounded = false;
      if (typeof e.jumpCD !== "number") e.jumpCD = 0;
      if (typeof e.jumpPower !== "number") e.jumpPower = 640;
    }
  }
}

function ensureBoss(lvl: any) {
  if (!lvl.boss) return;
  const b = lvl.boss as any;

  if (typeof b.id !== "string") b.id = "BOSS_1";

  if (typeof b.vx !== "number") b.vx = 0;
  if (typeof b.vy !== "number") b.vy = 0;
  if (typeof b.grounded !== "boolean") b.grounded = false;

  if (typeof b.minX !== "number") b.minX = 80;
  if (typeof b.maxX !== "number") b.maxX = 820;

  if (typeof b.moveSpeed !== "number") b.moveSpeed = 115;

  if (typeof b.maxHp !== "number") b.maxHp = 20;
  if (typeof b.hp !== "number") b.hp = b.maxHp;
  if (typeof b.alive !== "boolean") b.alive = true;

  if (typeof b.stateT !== "number") b.stateT = 0;

  if (typeof b.shootRate !== "number") b.shootRate = 1.05;
  if (typeof b.shootT !== "number") b.shootT = 0;
  if (typeof b.shootSpeed !== "number") b.shootSpeed = 430;
  if (typeof b.fireDelay !== "number") b.fireDelay = 0;
  if (typeof b.shootFlashT !== "number") b.shootFlashT = 0;
  if (typeof b.attackIndex !== "number") b.attackIndex = 0;
  if (typeof b.attackKind !== "string") b.attackKind = "single";
  if (typeof b.burstLeft !== "number") b.burstLeft = 0;
  if (typeof b.burstT !== "number") b.burstT = 0;

  if (typeof b.phase !== "number") b.phase = 1;
  if (typeof b.invulnT !== "number") b.invulnT = 0;
  if (typeof b.summonT !== "number") b.summonT = 0;

  if (typeof b.jumpCD !== "number") b.jumpCD = 0;
  if (typeof b.jumpPower !== "number") b.jumpPower = 760;

  if (typeof b.targetX !== "number") b.targetX = b.x;
  if (typeof b.repathT !== "number") b.repathT = 0;

  if (typeof b.aiMode !== "string") b.aiMode = "roam";
  if (typeof b.jumpPlan !== "object") b.jumpPlan = null;
}

function updateMovingPlatforms(dt: number, lvl: any) {
  const moving: MovingPlatform[] = (lvl.movingPlatforms ?? []) as MovingPlatform[];

  for (const mp of moving) {
    const prevX = mp.x;
    const prevY = mp.y;

    const dx = mp.x1 - mp.x0;
    const dy = mp.y1 - mp.y0;

    const dist = Math.hypot(dx, dy) || 1;
    const dtNorm = (mp.speed * dt) / dist;

    mp.t += dtNorm * mp.dir;

    if (mp.t > 1) {
      mp.t = 1;
      mp.dir = -1;
    } else if (mp.t < 0) {
      mp.t = 0;
      mp.dir = 1;
    }

    mp.x = mp.x0 + dx * mp.t;
    mp.y = mp.y0 + dy * mp.t;

    mp.dx = mp.x - prevX;
    mp.dy = mp.y - prevY;

    mp.vx = mp.dx / dt;
    mp.vy = mp.dy / dt;
  }
}

function onTopOfPlatform(ent: Rect, p: Rect) {
  const feet = ent.y + ent.h;
  const overlapX = ent.x + ent.w > p.x + 2 && ent.x < p.x + p.w - 2;
  const nearY = Math.abs(feet - p.y) <= 6;
  return overlapX && nearY;
}

function findSupportPlatform(ent: Rect, platforms: Rect[]) {
  for (const p of platforms) {
    if (onTopOfPlatform(ent, p)) return p;
  }
  return null;
}

function platformCenterX(p: Rect) {
  return p.x + p.w * 0.5;
}

function chooseBestPlatform(platforms: Rect[], playerX: number) {
  let best = platforms[0];
  let bestScore = 1e18;
  for (const p of platforms) {
    const d = Math.abs(platformCenterX(p) - playerX);
    if (d < bestScore) {
      bestScore = d;
      best = p;
    }
  }
  return best;
}

export function createEngine(events: EngineEvents, levelId = 1) {
  const spawn = { x: 80, y: 420 };
  if (levelId === 9) {
    spawn.x = 45;
  }

  const MAX_HP = levelId === 10 ? 20 : 3;
  const shieldEnabled = levelId === 10;
  const SHIELD_DURATION = 5.0;
  const SHIELD_RELOAD = 30.0;
  const SHIELD_MAX = 100;

  const baseLevel: Level = structuredClone(getLevel(levelId)) as any;
  if (!(baseLevel as any).spikes) (baseLevel as any).spikes = [];
  ensureCoins(baseLevel);
  ensureTrampolines(baseLevel);
  ensureMovingPlatforms(baseLevel);
  ensureLasers(baseLevel);
  ensureCannons(baseLevel);
  ensureEnemies(baseLevel);
  ensureBoss(baseLevel);

  let level: Level = structuredClone(baseLevel) as any;
  if (!(level as any).spikes) (level as any).spikes = [];
  ensureCoins(level);
  ensureTrampolines(level);
  ensureMovingPlatforms(level);
  ensureLasers(level);
  ensureCannons(level);
  ensureEnemies(level);
  ensureBoss(level);

  let coyote = 0;
  let jumpBuffer = 0;

  const bullets: any[] = [];
  const impacts: any[] = [];
  let bossDefeatSent = false;

  const human: any = {
    x: spawn.x,
    y: spawn.y,
    w: 32,
    h: 32,
    vx: 0,
    vy: 0,
    grounded: false,
    facing: 1,
    dashCD: 0,
    dashT: 0,
    muzzleT: 0,
    hp: MAX_HP,
    maxHp: MAX_HP,

    // SHIELD (hold C)
    shieldEnabled,
    shieldMax: SHIELD_MAX,
    shield: SHIELD_MAX,
    shieldT: 0,
    shieldCD: 0,
    shieldDuration: SHIELD_DURATION,
    shieldReload: SHIELD_RELOAD,
    shieldHitT: 0,
    shieldRegenDelay: 0,
    hurtT: 0,
    deadT: 0,
    dead: false,
  };

  function resetLevel() {
    human.x = spawn.x;
    human.y = spawn.y;
    human.vx = 0;
    human.vy = 0;
    human.grounded = false;
    human.facing = 1;
    human.dashCD = 0;
    human.dashT = 0;
    human.muzzleT = 0;
    human.hp = MAX_HP;

    human.shieldT = 0;
    human.shieldCD = 0;
    human.shield = SHIELD_MAX;
    human.shielding = false;
    human.shieldHitT = 0;
    human.shieldRegenDelay = 0;

    human.hurtT = 0;
    human.deadT = 0;
    human.dead = false;

    ridingMpId = null;

    level = structuredClone(baseLevel) as any;
    if (!(level as any).spikes) (level as any).spikes = [];
    ensureCoins(level);
    ensureTrampolines(level);
    ensureMovingPlatforms(level);
    ensureLasers(level);
    ensureCannons(level);
    ensureEnemies(level);
    ensureBoss(level);

    bullets.length = 0;
    impacts.length = 0;
    bossDefeatSent = false;
  }

  function defeatBoss(boss: any) {
    boss.hp = 0;
    boss.alive = false;
    if (!bossDefeatSent) {
      bossDefeatSent = true;
      events.onBossDefeated?.();
    }
  }

  function shieldFrontBlocks(srcDir: 1 | -1) {
    return human.shielding && human.shield > 0 && human.facing === srcDir;
  }

  function consumeShield(amount: number) {
    human.shield = Math.max(0, human.shield - amount);
    human.shieldHitT = 0.12;
    human.shieldRegenDelay = 0.45;

    if (human.shield <= 0) {
      human.shield = 0;
      human.shielding = false;
      human.shieldCD = 0.75;
      human.shieldRegenDelay = 0.9;
    }
  }

  function hurtPlayer(
    dmg = 1,
    kind: "melee" | "bullet" | "hazard" = "melee",
    srcDir?: 1 | -1
  ) {
    if (human.dead) return;
    if (human.hurtT > 0) return;
    if (human.shieldT > 0) return; // Invulnerable while shield is active

    if (shieldEnabled && kind !== "hazard" && srcDir && shieldFrontBlocks(srcDir)) {
      consumeShield(kind === "bullet" ? 16 : 22);
      human.hurtT = 0.12;
      return;
    }

    human.hp -= dmg;
    human.hurtT = 0.6;
    if (human.hp <= 0) {
      human.hp = 0;
      human.dead = true;
      human.deadT = .7;
      events.onLose?.();
    }
  }

  function spawnBossBullet(x: number, y: number, vx: number, vy: number) {
    bullets.push({
      id: "bb_" + Math.random().toString(16).slice(2),
      x,
      y,
      w: 32,
      h: 32,
      vx,
      vy,
      alive: true,
      dir: vx >= 0 ? 1 : -1,
      from: "enemy",
    });
  }

  function spawnShockwave(boss: any) {
    const y = boss.y + boss.h - 6;
    spawnBossBullet(boss.x + boss.w * 0.5 - 6, y, -360, 0);
    spawnBossBullet(boss.x + boss.w * 0.5 - 6, y, 360, 0);
  }

  function spawnFlyingMinion(boss: any) {
    const id = "min_" + Math.random().toString(16).slice(2);
    const baseY = clamp(boss.y - 90, 80, 360);

    (level as any).enemies.push({
      id,
      x: clamp(boss.x - 20, 80, 780),
      y: baseY,
      w: 32,
      h: 32,
      vx: (Math.random() > 0.5 ? 1 : -1) * 120,
      vy: 0,
      alive: true,
      hp: 2,
      minX: 60,
      maxX: 840,
      flying: true,
      baseY,
      amp: 20,
      freq: 1.15,
      phase: 0,
    });
  }

  type JumpPoint = { id: string; x: number; y: number; w: number; h: number; platY: number };

  const JUMP_POINTS: JumpPoint[] = [
    // Ground pads
    { id: "G_L", x: 40, y: 450, w: 32, h: 32, platY: 480 },
    { id: "G_M", x: 360, y: 450, w: 32, h: 32, platY: 480 },
    { id: "G_R", x: 760, y: 450, w: 32, h: 32, platY: 480 },

    // Lower left platform (y=380)
    { id: "LL_R", x: 250, y: 350, w: 32, h: 32, platY: 380 },

    // Lower right platform (y=380)
    { id: "LR_L", x: 600, y: 350, w: 32, h: 32, platY: 380 },

    // Mid platform (y=290) left and right pads
    { id: "MID_L", x: 360, y: 260, w: 32, h: 32, platY: 290 },
    { id: "MID_R", x: 490, y: 260, w: 32, h: 32, platY: 290 },

    // Upper left platform (y=180)
    { id: "UL_L", x: 120, y: 150, w: 32, h: 32, platY: 180 },

    // Upper right platform (y=180)
    { id: "UR_R", x: 725, y: 150, w: 32, h: 32, platY: 180 },
  ];


  function updateBoss(dt: number, boss: any, solidsAll: Rect[]) {
    if (!boss || !boss.alive || boss.hp <= 0) return;

    // ===================== Timers =====================
    boss.invulnT = Math.max(0, (boss.invulnT ?? 0) - dt);
    boss.jumpCD = Math.max(0, (boss.jumpCD ?? 0) - dt);
    boss.repathT = Math.max(0, (boss.repathT ?? 0) - dt);
    boss.windupT = Math.max(0, (boss.windupT ?? 0) - dt);
    boss.contactCD = Math.max(0, (boss.contactCD ?? 0) - dt);

    boss.landLockT = Math.max(0, (boss.landLockT ?? 0) - dt);
    boss.groundStableT = boss.grounded ? Math.min(0.25, (boss.groundStableT ?? 0) + dt) : 0;

    boss.shootT = (boss.shootT ?? 0) + dt;
    boss.burstT = Math.max(0, (boss.burstT ?? 0) - dt);
    boss.shootFlashT = Math.max(0, (boss.shootFlashT ?? 0) - dt);
    // boss.fireDelay is handled later to trigger bullet spawn accurately
    
    boss.summonT = (boss.summonT ?? 0) + dt;
    if (boss.phase === 3 && boss.summonT >= 6.5) {
      boss.summonT = 0;
      if (typeof spawnFlyingMinion === "function") spawnFlyingMinion(boss);
    }

    (human as any).invulnT = Math.max(0, ((human as any).invulnT ?? 0) - dt);

    // ===================== Platforms =====================
    const platforms: Rect[] = (level.platforms ?? []) as any;
    if (!platforms || platforms.length === 0) return;

    // pick "ground" as lowest platform (largest y)
    let ground = platforms[0];
    for (const p of platforms) if (p.y > ground.y) ground = p;

    const arenaMinX = ground.x;
    const arenaMaxX = ground.x + ground.w;

    // ===================== Merge solids =====================
    const sig = (r: Rect) => `${r.x},${r.y},${r.w},${r.h}`;
    const solidSet = new Set((solidsAll ?? []).map(sig));
    const solids: Rect[] = [...(solidsAll ?? [])];
    for (const p of platforms) {
      const k = sig(p);
      if (!solidSet.has(k)) {
        solidSet.add(k);
        solids.push(p);
      }
    }

    // ===================== Phase tuning =====================
    const hpPct = boss.hp / Math.max(1, boss.maxHp ?? boss.hp ?? 1);
    boss.phase = hpPct > 0.66 ? 1 : hpPct > 0.33 ? 2 : 3;

    const baseMove = boss.moveSpeed ?? 135;
    const moveSpeed = baseMove * (boss.phase === 1 ? 1.25 : boss.phase === 2 ? 1.35 : 1.5);
    const accel = boss.phase === 1 ? 5200 : boss.phase === 2 ? 6200 : 7400;

    const shootRate =
      (boss.shootRate ?? 1.05) * (boss.phase === 1 ? 1.12 : boss.phase === 2 ? 0.96 : 0.86);

    const jumpPower = boss.jumpPower ?? 760;

    // ===================== Helpers =====================
    const rectCX = (r: Rect) => r.x + r.w * 0.5;

    function clampToPlatformX(p: Rect, xLeft: number) {
      const left = p.x + 8;
      const right = p.x + p.w - boss.w - 8;
      if (right <= left) return left;
      return clamp(xLeft, left, right);
    }

    // ---- KEY FIX: "supported" check even if grounded flag is wrong ----
    function supported(ent: any, epsYTop = 20, epsYBelow = 8) {
      const feet = ent.y + ent.h;
      const vy = ent.vy ?? 0;
      if (vy < -240) return false; // ignore while launching upward
      for (const p of platforms) {
        const overlapX = ent.x + ent.w > p.x + 2 && ent.x < p.x + p.w - 2;
        if (!overlapX) continue;
        const dy = feet - p.y; // 0 when exactly on top
        // allow slight penetration / float due to solver
        if (dy >= -epsYTop && dy <= epsYBelow) return true;
      }
      return false;
    }

    function standingOnAny(ent: any, p: Rect, epsY = 20) {
      const feet = ent.y + ent.h;
      const overlapX = ent.x + ent.w > p.x + 2 && ent.x < p.x + p.w - 2;
      if (!overlapX) return false;
      const vy = ent.vy ?? 0;
      if (vy < -240) return false;
      return Math.abs(feet - p.y) <= epsY;
    }

    function getStandingPlatformIndex(ent: any) {
      const eps = 22;
      for (let i = 0; i < platforms.length; i++) {
        if (standingOnAny(ent, platforms[i], eps)) return i;
      }
      return -1;
    }

    function getSupportPlatformIndex(ent: any) {
      const stand = getStandingPlatformIndex(ent);
      if (stand !== -1) return stand;

      const cx = ent.x + ent.w * 0.5;
      const feet = ent.y + ent.h;

      let best = 0;
      let bestScore = 1e18;

      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        const dx = Math.abs(cx - rectCX(p));
        const dy = Math.abs(feet - p.y);

        const outside =
          cx < p.x ? (p.x - cx) : cx > p.x + p.w ? (cx - (p.x + p.w)) : 0;

        // MORE WEIGHT ON DY so player far on Y becomes a different node
        const score = dy * 4.8 + dx * 0.65 + outside * 6.0;

        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      }
      return best;
    }

    function platformTakeoffX(from: Rect, to: Rect) {
      const fromLeft = from.x + 10;
      const fromRight = from.x + from.w - boss.w - 10;
      const goRight = rectCX(to) >= rectCX(from);
      const x = goRight ? fromRight : fromLeft;
      return clamp(x, fromLeft, fromRight);
    }

    function platformLandingX(to: Rect, from: Rect) {
      const toLeft = to.x + 14;
      const toRight = to.x + to.w - boss.w - 14;
      const comingFromLeft = rectCX(from) < rectCX(to);
      const x = comingFromLeft ? toLeft : toRight;
      return clamp(x, toLeft, toRight);
    }

    function inRange(x: number, a: number, b: number, eps = 4) {
      return x >= a - eps && x <= b + eps;
    }

    // ===================== Auto nav graph (cached) =====================
    const platHash = platforms.map(sig).join("|");
    if (boss._navHash !== platHash) {
      boss._navHash = platHash;
      boss._navAdj = null;
    }

    function buildNavGraph() {
      const g = PHYS.GRAVITY;
      const jumpV = jumpPower;

      function jumpTime(fromY: number, toY: number) {
        const hMax = (jumpV * jumpV) / (2 * g);
        const needUp = fromY - toY;
        if (needUp > hMax - 8) return null;

        // 0.5*g*t^2 - jumpV*t + (fromY - toY) = 0
        const a = 0.5 * g;
        const b = -jumpV;
        const c = fromY - toY;
        const disc = b * b - 4 * a * c;
        if (disc < 0) return null;

        const t1 = (-b - Math.sqrt(disc)) / (2 * a);
        const t2 = (-b + Math.sqrt(disc)) / (2 * a);
        const t = Math.max(t1, t2);
        if (!(t > 0.14 && t < 1.65)) return null;
        return t;
      }

      const adj: number[][] = Array.from({ length: platforms.length }, () => []);
      const maxAirVx = Math.max(moveSpeed * 3.2, 720);

      for (let i = 0; i < platforms.length; i++) {
        for (let j = 0; j < platforms.length; j++) {
          if (i === j) continue;

          const A = platforms[i];
          const B = platforms[j];

          const fromY = A.y - boss.h;
          const toY = B.y - boss.h;

          const t = jumpTime(fromY, toY);
          if (!t) continue;

          const a0 = A.x, a1 = A.x + A.w;
          const b0 = B.x, b1 = B.x + B.w;

          const gap = b0 > a1 ? b0 - a1 : a0 > b1 ? a0 - b1 : 0;
          if (gap > maxAirVx * t + 60) continue;

          const dy = Math.abs(B.y - A.y);
          const dx = Math.abs(rectCX(B) - rectCX(A));
          if (dy > 540 || dx > 1600) continue;

          adj[i].push(j);
        }
      }

      return adj;
    }

    const adj: number[][] = boss._navAdj ?? (boss._navAdj = buildNavGraph());

    function bfsPath(start: number, goal: number) {
      if (start === goal) return [start];
      const q: number[] = [start];
      const prev = new Array(adj.length).fill(-1);
      prev[start] = start;

      while (q.length) {
        const u = q.shift()!;
        for (const v of adj[u]) {
          if (prev[v] !== -1) continue;
          prev[v] = u;
          if (v === goal) {
            q.length = 0;
            break;
          }
          q.push(v);
        }
      }
      if (prev[goal] === -1) return null;

      const path: number[] = [];
      let cur = goal;
      while (cur !== start) {
        path.push(cur);
        cur = prev[cur];
      }
      path.push(start);
      path.reverse();
      return path;
    }

    // ===================== AI state =====================
    if (typeof boss.aiMode !== "string") boss.aiMode = "chase"; // chase | go_pad | midair
    if (!boss.plan) boss.plan = null;

    const bossNode = getSupportPlatformIndex(boss);
    const playerNode = getSupportPlatformIndex(human);

    const playerCX = human.x + human.w * 0.5;
    const bossCX = boss.x + boss.w * 0.5;
    const dirToPlayer: 1 | -1 = playerCX >= bossCX ? 1 : -1;

    const bossSupported = boss.grounded || supported(boss);
    const playerSupported = (human as any).grounded || supported(human);

    const playerAbove = (human.y + human.h) < (boss.y + boss.h) - 55;
    const playerFarY = Math.abs((human.y + human.h) - (boss.y + boss.h)) > 70;

    const needVerticalChase = bossSupported && (playerAbove || playerFarY);

    // ===================== Replan (ALWAYS if far / different) =====================
    // Fix: even if standing detection glitches, we still replan using supported()
    if (bossSupported && boss.repathT <= 0) {
      boss.repathT = 0.08;

      if ((bossNode !== playerNode || needVerticalChase) && boss.landLockT <= 0) {
        const path = bfsPath(bossNode, playerNode);
        if (path && path.length >= 2) {
          const from = path[0];
          const to = path[1];

          const pFrom = platforms[from];
          const pTo = platforms[to];

          const takeX = platformTakeoffX(pFrom, pTo);
          const landX = platformLandingX(pTo, pFrom);

          boss.plan = {
            from,
            to,
            takeX,
            landX,
            takePad: [takeX - 12, takeX + 12],
            landPad: [landX - 18, landX + 18],
            airT: 0,
          };

          boss.aiMode = "go_pad";
        } else {
          boss.plan = null;
          boss.aiMode = "chase";
        }
      } else {
        boss.plan = null;
        boss.aiMode = "chase";
      }
    }

    // ===================== Movement =====================
    if (boss.aiMode === "go_pad" && boss.plan) {
      const targetX = boss.plan.takeX;
      const dx = targetX - boss.x;

      boss.vx = approach(boss.vx ?? 0, clamp(dx * 6.2, -moveSpeed, moveSpeed), accel * dt);

      // use supported() instead of only grounded flag
      if (bossSupported && Math.abs(dx) < 5.0) {
        boss.x = targetX;
        boss.vx = 0;

        const pFrom = platforms[boss.plan.from];
        boss.y = pFrom.y - boss.h;

        if (boss.jumpCD <= 0) {
          if (boss.windupT <= 0) boss.windupT = 0.14;

          if (boss.windupT <= dt + 0.004) {
            if (boss.landLockT > 0 || (boss.groundStableT ?? 0) < 0.06) {
              boss.windupT = 0;
            } else if (!inRange(boss.x, boss.plan.takePad[0], boss.plan.takePad[1], 3)) {
              boss.windupT = 0;
              boss.jumpCD = 0.10;
            } else {
              boss.vy = -jumpPower;
              boss.grounded = false;

              // smooth takeoff
              const airMax = Math.max(moveSpeed * 2.6, 760);
              const toward = clamp((boss.plan.landX - boss.x) * 3.1, -airMax, airMax);
              const forward = dirToPlayer * Math.min(airMax, Math.max(220, moveSpeed * 1.35));
              boss.vx = 0.55 * forward + 0.45 * toward;

              boss.aiMode = "midair";
              boss.jumpCD = boss.phase === 1 ? 0.62 : boss.phase === 2 ? 0.55 : 0.48;
              boss.plan.airT = 0;
              boss.windupT = 0;
            }
          }
        }
      }
    } else if (boss.aiMode === "midair" && boss.plan) {
      boss.plan.airT = (boss.plan.airT ?? 0) + dt;

      const airMax = Math.max(moveSpeed * 2.7, 760);
      const desire = clamp((boss.plan.landX - boss.x) * 3.2, -airMax, airMax);
      boss.vx = approach(boss.vx ?? 0, desire, 5200 * dt);
    } else {
      // ===================== CHASE (pressure + "stick" if player stops) =====================
      const pvx = (human as any).vx ?? 0;

      const targetCenterX = (human.x + human.w * 0.5) - (boss.w * 0.5);
      const playerStopped = Math.abs(pvx) < 10;

      // IMPORTANT: when player is FAR, don't use small lead -> just hard chase
      const lead = playerStopped ? 0 : 0.16;

      let desiredX = targetCenterX + pvx * lead;

      const sp = getStandingPlatformIndex(boss);
      if ((bossSupported || sp !== -1) && sp !== -1 && platforms[sp] !== ground) {
        desiredX = clampToPlatformX(platforms[sp], desiredX);
      } else {
        desiredX = clamp(desiredX, arenaMinX, arenaMaxX - boss.w);
      }

      const ddx = desiredX - boss.x;

      // FORCE movement even when very far (never "stall")
      const far = Math.abs(ddx) > 120;
      const chaseGain = playerStopped ? 18.0 : far ? 11.5 : 9.0;

      const hardMax = playerStopped ? moveSpeed * 1.8 : far ? moveSpeed * 1.55 : moveSpeed * 1.25;
      const hardAccel = playerStopped ? accel * 1.8 : far ? accel * 1.45 : accel * 1.15;

      // minimum pressure speed so boss always moves
      const minPress = far ? 90 : 35;
      let targetV = clamp(ddx * chaseGain, -hardMax, hardMax);
      if (Math.abs(targetV) < minPress) targetV = Math.sign(ddx || dirToPlayer) * minPress;

      boss.vx = approach(boss.vx ?? 0, targetV, hardAccel * dt);

      if (playerStopped && Math.abs(ddx) < 2.0 && bossSupported) {
        boss.x = desiredX;
        boss.vx = 0;
      }
    }

    // ===================== Physics integration =====================
    const prevX = boss.x;
    const prevY = boss.y;
    const vyBefore = boss.vy ?? 0;

    boss.vy = (boss.vy ?? 0) + PHYS.GRAVITY * dt;

    boss.x += (boss.vx ?? 0) * dt;
    resolveX(boss, prevX, solids);

    boss.y += (boss.vy ?? 0) * dt;
    const tmp = { x: boss.x, y: boss.y, w: boss.w, h: boss.h, vy: boss.vy, grounded: boss.grounded };
    resolveY(tmp, prevY, solids);
    boss.y = tmp.y;
    boss.vy = tmp.vy;
    boss.grounded = tmp.grounded;

    boss.x = clamp(boss.x, arenaMinX, arenaMaxX - boss.w);

    // landed -> clear plan and lock briefly
    if (boss.aiMode === "midair" && (boss.grounded || supported(boss))) {
      boss.aiMode = "chase";
      boss.plan = null;
      boss.repathT = 0;
      boss.windupT = 0;
      boss.landLockT = boss.phase >= 2 ? 0.6 : 0.16; // Longer lock for slam animation
      boss.jumpCD = Math.max(boss.jumpCD ?? 0, 0.12);

      // Phase-based landing behavior: shockwaves
      if (boss.phase >= 2 && typeof spawnShockwave === "function") {
        spawnShockwave(boss);
      }
    }

    // bonk recovery
    const bonked = vyBefore < -80 && boss.vy > -2 && !boss.grounded;
    if (bonked) {
      boss.aiMode = "chase";
      boss.plan = null;
      boss.repathT = 0;
      boss.jumpCD = Math.max(boss.jumpCD ?? 0, 0.22);
      boss.vx = (boss.vx ?? 0) * 0.35;
      boss.windupT = 0;
    }

    // ===================== Shooting =====================
    const distShoot = Math.abs(playerCX - (boss.x + boss.w * 0.5));
    const canShoot = distShoot > 110 && distShoot < 640;
    const stable = Math.abs(boss.vx ?? 0) < moveSpeed * 1.35 && (boss.landLockT ?? 0) <= 0;

    function chooseBossAttack() {
      boss.attackIndex = (boss.attackIndex ?? 0) + 1;
      if (boss.phase === 1) return "single";
      if (boss.phase === 2) return "double";
      return "spread";
    }

    function fireBossPattern(kind: string) {
      const bulletSize = 32;
      const muzzleCX = dirToPlayer === 1 ? boss.x + boss.w + 8 : boss.x - 8;
      const muzzleCY = boss.y + boss.h * 0.45;
      const sx = muzzleCX - bulletSize * 0.5;
      const sy = muzzleCY - bulletSize * 0.5;
      const speed = boss.shootSpeed ?? 300;
      const playerCY = human.y + human.h * 0.5;
      const aimedVy = clamp((playerCY - muzzleCY) * 1.1, -220, 220);

      if (typeof spawnBossBullet !== "function") return;

      boss.shootFlashT = 0.18;

      if (kind === "spread") {
        spawnBossBullet(sx, sy, speed * dirToPlayer, aimedVy);
        spawnBossBullet(sx, sy - 6, speed * dirToPlayer, aimedVy - 170);
        spawnBossBullet(sx, sy + 6, speed * dirToPlayer, aimedVy + 170);
        return;
      }

      if (kind === "double") {
        spawnBossBullet(sx, sy - 5, speed * dirToPlayer, aimedVy - 80);
        spawnBossBullet(sx, sy + 5, speed * dirToPlayer, aimedVy + 80);
        return;
      }

      spawnBossBullet(sx, sy, speed * dirToPlayer, aimedVy);
    }

    const bossBusyShooting = (boss.fireDelay ?? 0) > 0;
    if (canShoot && stable && !bossBusyShooting && boss.shootT >= shootRate) {
      boss.shootT = 0;
      boss.attackKind = chooseBossAttack();
      boss.fireDelay = 0.42;
    }

    const prevFD = boss.fireDelay ?? 0;
    boss.fireDelay = Math.max(0, boss.fireDelay - dt);

    if (prevFD > 0 && boss.fireDelay === 0) {
      fireBossPattern(boss.attackKind ?? "single");
    }

    boss.burstLeft = 0;

    // ===================== Contact damage =====================
    const touching = typeof aabb === "function" ? aabb(human, boss) : false;
    const dashingNow = ((human as any).dashT ?? 0) > 0.04;

    if (touching) {
      if (dashingNow) {
        if ((boss.invulnT ?? 0) <= 0) {
          boss.hp -= 10;
          boss.invulnT = 0.25;
          boss.contactCD = 0.12;
          (human as any).dashT = 0;
          if (boss.hp <= 0) defeatBoss(boss);
        }
      } else {
        if (((human as any).invulnT ?? 0) <= 0 && (boss.contactCD ?? 0) <= 0) {
          const srcDir: 1 | -1 = human.x + human.w * 0.5 >= boss.x + boss.w * 0.5 ? 1 : -1;
          if (typeof hurtPlayer === "function") hurtPlayer(1, "melee", srcDir);
          (human as any).invulnT = 0.35;
          boss.contactCD = 0.25;
          (human as any).vx = ((human as any).vx ?? 0) + srcDir * 120;
        }
      }
    }

    // ===================== State Mapping =====================
    if (boss.fireDelay > 0) {
      boss.state = "telegraph"; // Triggers attack4 (shoot windup)
    } else if (boss.shootFlashT > 0 || boss.burstLeft > 0) {
      boss.state = "shoot"; // Triggers attack3 while bullets leave the boss
    } else if (boss.landLockT > 0 && boss.phase >= 2) {
      boss.state = "slam"; // Triggers attack2 (landing slam)
    } else if (Math.abs(boss.vx) > 5) {
      boss.state = "patrol"; // Triggers run animation
    } else {
      boss.state = "idle";
    }
  }





  let ridingMpId: string | null = null;

  function step(dt: number, I: InputState) {
    dt = Math.min(0.033, dt);

    for (let i = impacts.length - 1; i >= 0; i--) {
      impacts[i].t -= dt;
      if (impacts[i].t <= 0) impacts.splice(i, 1);
    }

    if (human.dead) {
      human.hurtT = Math.max(0, human.hurtT - dt);
      human.deadT = Math.max(0, human.deadT - dt);

      events.onUI({
        hp: human.hp,
        enemiesLeft:
          level.enemies.filter((e: any) => e.alive && e.hp > 0).length +
          (((level as any).boss && (level as any).boss.alive && (level as any).boss.hp > 0) ? 1 : 0),
        doorOpen: level.door.open,
        coins: (((level as any).coins ?? []) as Coin[]).filter((c) => c.collected).length,
        coinsTotal: (((level as any).coins ?? []) as Coin[]).length,
      });

      return;
    }

    for (const t of (level as any).trampolines ?? []) {
      t.bounceT = Math.max(0, (t.bounceT ?? 0) - dt);
    }

    human.hurtT = Math.max(0, human.hurtT - dt);
    human.shieldT = Math.max(0, human.shieldT - dt);
    human.shieldCD = Math.max(0, human.shieldCD - dt);

    // Shield ability: press C on the boss level. Change these times above:
    // SHIELD_DURATION controls how long it stays on, SHIELD_RELOAD controls recharge.
    if (shieldEnabled && I.defend && human.shieldCD <= 0 && human.shieldT <= 0) {
      human.shield = SHIELD_MAX;
      human.shieldT = SHIELD_DURATION;
      human.shieldCD = SHIELD_RELOAD;
    }

    human.shielding = shieldEnabled && human.shieldT > 0;
    human.shieldActivePct = shieldEnabled ? clamp(human.shieldT / SHIELD_DURATION, 0, 1) : 0;
    human.shieldReadyPct = shieldEnabled ? 1 - clamp(human.shieldCD / SHIELD_RELOAD, 0, 1) : 0;

    if (I.jump) jumpBuffer = 0.12;
    else jumpBuffer = Math.max(0, jumpBuffer - dt);

    if (human.grounded) coyote = 0.12;
    else coyote = Math.max(0, coyote - dt);

    const worldWalls: Rect[] = [
      { x: -50, y: 0, w: 50, h: H },
      { x: W, y: 0, w: 50, h: H },
    ];

    updateMovingPlatforms(dt, level);

    const mps: MovingPlatform[] = ((level as any).movingPlatforms ?? []) as MovingPlatform[];
    const movingRects: Rect[] = mps as any;

    const solidsAll: Rect[] = [...level.platforms, ...movingRects, ...worldWalls];

    let riding: MovingPlatform | null = null;
    if (ridingMpId) {
      riding = mps.find((p) => p.id === ridingMpId) ?? null;
      if (!riding) ridingMpId = null;
    }

    if (riding && human.vy >= 0) {
      human.x += riding.dx;
      human.y += riding.dy;
      human.y = riding.y - human.h - EPS;
      human.grounded = true;
      if (human.vy > 0) human.vy = 0;
    }

    const solidsForSolve = riding ? solidsAll.filter((s) => s !== (riding as any)) : solidsAll;

    human.dashCD = Math.max(0, human.dashCD - dt);
    human.dashT = Math.max(0, human.dashT - dt);
    human.muzzleT = Math.max(0, human.muzzleT - dt);

    const dir = (I.right ? 1 : 0) - (I.left ? 1 : 0);
    if (dir !== 0) human.facing = dir as 1 | -1;

    if (I.dash && human.dashCD <= 0 && human.dashT <= 0) {
      human.dashT = 0.12;
      human.dashCD = 0.55;
    }

    if (human.dashT > 0) human.vx = PHYS.DASH_VX * human.facing;
    else human.vx = dir * PHYS.MAX_VX;

    human.vy += PHYS.GRAVITY * dt;

    let didJump = false;
    if (jumpBuffer > 0 && coyote > 0) {
      human.vy = -PHYS.JUMP;
      human.grounded = false;
      jumpBuffer = 0;
      coyote = 0;
      didJump = true;
      ridingMpId = null;
      riding = null;
    }

    const prevPX = human.x;
    const prevPY = human.y;

    human.x += human.vx * dt;
    resolveX(human, prevPX, solidsForSolve);

    const prevY = human.y;
    human.y += human.vy * dt;
    resolveY(human, prevY, solidsForSolve);

    if (!didJump && human.vy >= 0) {
      let attached = false;

      for (const mp of mps) {
        const overlapX = human.x + human.w > mp.x + 2 && human.x < mp.x + mp.w - 2;
        if (!overlapX) continue;

        const prevBottom = prevPY + human.h;
        const bottom = human.y + human.h;
        const mpTopPrev = mp.y - mp.dy;
        const mpTopNow = mp.y;

        const landing =
          human.vy >= 0 &&
          prevBottom <= mpTopPrev + 2 &&
          bottom >= mpTopNow - 2 &&
          bottom <= mpTopNow + 18;

        const standing = human.grounded && Math.abs(bottom - mpTopNow) <= 6;

        if (!landing && !standing) continue;

        human.y = mp.y - human.h - EPS;
        human.grounded = true;
        if (human.vy > 0) human.vy = 0;

        ridingMpId = mp.id;
        attached = true;
        break;
      }

      if (!attached) ridingMpId = null;
    } else {
      if (!human.grounded) ridingMpId = null;
    }

    for (const t of (level as any).trampolines ?? []) {
      const hit = trampolineHitbox(t);
      const falling = human.vy >= 0;
      const prevBottom = prevY + human.h;
      const bottom = human.y + human.h;
      const overlapX = human.x + human.w > hit.x && human.x < hit.x + hit.w;
      const crossedTop = prevBottom <= hit.y + hit.h && bottom >= hit.y - 2;
      const overlappingPad = aabb(human, hit);
      const landing = falling && overlapX && (crossedTop || overlappingPad);

      if (landing) {
        human.y = hit.y - human.h - EPS;
        human.vy = -t.power;
        human.grounded = false;
        ridingMpId = null;
        t.bounceT = 0.16;
      }
    }

    const spikes: Spike[] = (((level as any).spikes ?? []) as Spike[]);
    for (const s of spikes) {
      if (aabb(human, spikeHitbox(s))) {
        hurtPlayer(MAX_HP, "hazard");
        if (human.hp <= 0) return;
      }
    }

    const coins: Coin[] = (((level as any).coins ?? []) as Coin[]);
    for (const c of coins) {
      if (!c.collected && aabb(human, c)) c.collected = true;
    }

    if (I.shoot && human.muzzleT <= 0) {
      const shootDir: 1 | -1 = (dir !== 0 ? dir : human.facing) as 1 | -1;
      human.facing = shootDir;

      bullets.push({
        id: "b_" + Math.random().toString(16).slice(2),
        x: shootDir === 1 ? human.x + human.w + 2 : human.x - 10,
        y: human.y + human.h * 0.5 - 2,
        w: 16,
        h: 16,
        vx: PHYS.BULLET_VX * shootDir,
        vy: 0,
        alive: true,
        dir: shootDir,
        from: "player",
      });

      human.muzzleT = 0.08;
    }

    for (const box of level.boxes) {
      const tryingToJump = I.jump;

      const prevBX = box.x;

      box.vy += PHYS.GRAVITY * dt;

      if (box.grounded) box.vx *= 0.85;
      if (Math.abs(box.vx) < 2) box.vx = 0;

      const boxPrevX = box.x;
      box.x += box.vx * dt;
      resolveX(box, boxPrevX, solidsAll);

      const boxPrevY = box.y;
      box.y += box.vy * dt;
      resolveY(box, boxPrevY, solidsAll);

      let carriedBy: MovingPlatform | null = null;

      for (const mp of mps) {
        const overlapX = box.x + box.w > mp.x + 2 && box.x < mp.x + mp.w - 2;
        if (!overlapX) continue;

        const prevBottom = boxPrevY + box.h;
        const bottom = box.y + box.h;

        const mpTopPrev = mp.y - mp.dy;
        const mpTopNow = mp.y;

        const landing =
          box.vy >= 0 &&
          prevBottom <= mpTopPrev + 2 &&
          bottom >= mpTopNow - 2 &&
          bottom <= mpTopNow + 18;

        const standing = box.grounded && Math.abs(bottom - mpTopNow) <= 6;

        if (landing || standing) {
          carriedBy = mp;

          box.y = mpTopNow - box.h - EPS;
          box.vy = 0;
          box.grounded = true;

          box.x += mp.dx;
          box.y += mp.dy;

          box.y = mp.y - box.h - EPS;
          break;
        }
      }

      const LEFT = 0;
      const RIGHT = W;

      const touchLeft = box.x <= LEFT + 5;
      const touchRight = box.x + box.w >= RIGHT - 5;

      if (touchRight) {
        box.x = RIGHT - box.w - EPS;
        box.vx = Math.min(box.vx, 0);
        box.vx -= 260;
      }

      if (touchLeft) {
        box.x = LEFT + EPS;
        box.vx = Math.max(box.vx, 0);
        box.vx += 260;
      }

      for (const t of (level as any).trampolines ?? []) {
        const hit = trampolineHitbox(t);
        const falling = box.vy >= 0;
        const prevBottom = boxPrevY + box.h;
        const bottom = box.y + box.h;
        const overlapX = box.x + box.w > hit.x && box.x < hit.x + hit.w;
        const crossedTop = prevBottom <= hit.y + hit.h && bottom >= hit.y - 2;
        const overlappingPad = aabb(box, hit);
        const landing = falling && overlapX && (crossedTop || overlappingPad);

        if (landing) {
          box.y = hit.y - box.h - EPS;
          box.vy = -t.power * 0.85;
          box.grounded = false;
        }
      }

      resolvePlayerBox(human, box, solidsAll, prevPX, prevPY, tryingToJump);

      const moved = box.x - prevBX;
      if (carriedBy) {
        box.vx = 0;
        box.vy = 0;
      } else {
        if (Math.abs(moved) > 0.001) box.vx = moved / dt;
      }
    }

    for (const e of level.enemies as any[]) {
      if (!e.alive) continue;

      const prevEX = e.x;
      const prevEY = e.y;

      const isFlying = !!e.flying;

      if (isFlying) {
        e.x += e.vx * dt;

        if (e.x < e.minX) {
          e.x = e.minX;
          e.vx = Math.abs(e.vx);
        } else if (e.x + e.w > e.maxX) {
          e.x = e.maxX - e.w;
          e.vx = -Math.abs(e.vx);
        }

        e.phase = (e.phase ?? 0) + dt;
        const baseY = e.baseY ?? e.y;
        const amp = e.amp ?? 18;
        const freq = e.freq ?? 1.2;

        e.y = baseY + Math.sin(e.phase * Math.PI * 2 * freq) * amp;
        e.y = clamp(e.y, 10, H - 10 - e.h);
      } else {
        e.vy += PHYS.GRAVITY * dt;
        e.y += e.vy * dt;

        const tmp = { x: e.x, y: e.y, w: e.w, h: e.h, vy: e.vy, grounded: false };
        resolveY(tmp, prevEY, solidsAll);
        e.y = tmp.y;
        e.vy = tmp.vy;
        e.grounded = tmp.grounded;

        e.jumpCD = Math.max(0, (e.jumpCD ?? 0) - dt);
        if (typeof e.jumpPower !== "number") e.jumpPower = 640;

        const playerClose = Math.abs((human.x + human.w * 0.5) - (e.x + e.w * 0.5)) < 170;
        const playerAbove = human.y + human.h < e.y - 10;

        if (e.grounded && e.jumpCD <= 0 && playerClose && (playerAbove || Math.random() < 0.015)) {
          e.vy = -e.jumpPower;
          e.grounded = false;
          e.jumpCD = 2.8;
        }

        e.x += e.vx * dt;

        for (const p of solidsAll) {
          if (aabb(e, p)) {
            e.x = prevEX;
            e.vx *= -1;
            break;
          }
        }

        if (e.x < e.minX) {
          e.x = e.minX;
          e.vx = Math.abs(e.vx);
        } else if (e.x + e.w > e.maxX) {
          e.x = e.maxX - e.w;
          e.vx = -Math.abs(e.vx);
        }
      }

      e.shootT = (e.shootT ?? 0) + dt;
      const enemyCX = e.x + e.w * 0.5;
      const enemyCY = e.y + e.h * 0.5;
      const playerCXForEnemy = human.x + human.w * 0.5;
      const playerCYForEnemy = human.y + human.h * 0.5;
      const shootDx = playerCXForEnemy - enemyCX;
      const shootDy = playerCYForEnemy - enemyCY;
      const canEnemyShoot =
        Math.abs(shootDx) <= (e.shootRange ?? 380) &&
        Math.abs(shootDx) >= 60 &&
        Math.abs(shootDy) <= 95;

      if (canEnemyShoot && e.shootT >= (e.shootRate ?? 2.6)) {
        const shootDir: 1 | -1 = shootDx >= 0 ? 1 : -1;
        const bulletSize = 14;
        e.shootT = 0;
        e.vx = Math.abs(e.vx ?? 80) * shootDir;

        bullets.push({
          id: "eb_" + Math.random().toString(16).slice(2),
          x: enemyCX + shootDir * (e.w * 0.5 + 4) - bulletSize * 0.5,
          y: enemyCY - bulletSize * 0.5,
          w: bulletSize,
          h: bulletSize,
          vx: (e.shootSpeed ?? 260) * shootDir,
          vy: clamp(shootDy * 0.45, -90, 90),
          alive: true,
          dir: shootDir,
          from: "enemy",
        });
      }

      if (aabb(human, e)) {
        const srcDir: 1 | -1 = (human.x + human.w * 0.5 >= e.x + e.w * 0.5 ? 1 : -1);
        hurtPlayer(1, "melee", srcDir);
        if (human.hp <= 0) return;
      }
    }

    const boss = (level as any).boss as any | undefined;
    if (boss && boss.alive && boss.hp > 0) {
      updateBoss(dt, boss, solidsAll);
      if (!boss.alive || boss.hp <= 0) defeatBoss(boss);
    }

    for (const b of bullets) {
      if (!b.alive) continue;

      b.x += b.vx * dt;
      b.y += (b.vy ?? 0) * dt;

      if (b.x < -120 || b.x > W + 120 || b.y < -120 || b.y > H + 120) {
        b.alive = false;
        continue;
      }

      if (solidsAll.some((s) => aabb(b, s))) {
        if (typeof b.id === "string" && (b.id.startsWith("cb_") || b.id.startsWith("bb_") || b.id.startsWith("eb_"))) {
          impacts.push({
            x: b.x + b.w * 0.5,
            y: b.y + b.h * 0.5,
            t: 0.12,
            kind: b.id.startsWith("bb_") ? "boss" : "cannon",
          });
        }
        b.alive = false;
        continue;
      }

      if (level.boxes.some((box) => aabb(b, box))) {
        if (typeof b.id === "string" && (b.id.startsWith("cb_") || b.id.startsWith("bb_") || b.id.startsWith("eb_"))) {
          impacts.push({
            x: b.x + b.w * 0.5,
            y: b.y + b.h * 0.5,
            t: 0.12,
            kind: b.id.startsWith("bb_") ? "boss" : "cannon",
          });
        }
        b.alive = false;
        continue;
      }

      if (b.from === "enemy" && aabb(b, human)) {
        b.alive = false;
        const srcDir: 1 | -1 = (b.dir === 1 ? -1 : 1);
        hurtPlayer(1, "bullet", srcDir);
        if (human.hp <= 0) return;
      }

      if (b.from === "player") {
        for (const e of level.enemies as any[]) {
          if (!e.alive) continue;
          if (aabb(b, e)) {
            e.hp -= 1;
            if (e.hp <= 0) e.alive = false;
            b.alive = false;
            break;
          }
        }

        const boss2 = (level as any).boss as any | undefined;
        if (b.alive && boss2 && boss2.alive && boss2.hp > 0 && aabb(b, boss2)) {
          boss2.hp -= 1;
          boss2.invulnT = 0.2; // Trigger hurt animation
          b.alive = false;
          if (boss2.hp <= 0) defeatBoss(boss2);
        }
      }
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      if (!bullets[i].alive) bullets.splice(i, 1);
    }

    for (const s of level.switches) {
      if (s.pressed) continue;
      s.pressed = aabb(human, s) || level.boxes.some((box) => aabb(box, s));
    }

    const bossAlive = !!((level as any).boss && (level as any).boss.alive && (level as any).boss.hp > 0);
    const switchesOK = level.switches.length === 0 ? true : level.switches.every((s) => s.pressed);
    level.door.open = switchesOK && !bossAlive;

    const lasers = ((level as any).lasers ?? []) as any[];
    for (const l of lasers) {
      if (l.controlledBy) {
        const sw = level.switches.find((s) => s.id === l.controlledBy);
        const pressed = !!sw?.pressed;
        l.on = l.invert ? !pressed : pressed;
        l.t = 0;
      } else {
        l.t += dt;
        if (l.on && l.t >= l.onFor) {
          l.on = false;
          l.t = 0;
        } else if (!l.on && l.t >= l.offFor) {
          l.on = true;
          l.t = 0;
        }
      }

      if (l.on && aabb(human, laserHitbox(l))) {
        hurtPlayer(1, "hazard");
        if (human.hp <= 0) return;
      }
    }

    const cannons = ((level as any).cannons ?? []) as any[];
    for (const c of cannons) {
      if (!c.enabled) continue;

      c.fireT = Math.max(0, (c.fireT ?? 0) - dt);
      c.t += dt;
      if (c.t >= c.rate) {
        c.t = 0;
        c.fireT = 0.12;

        bullets.push({
          id: "cb_" + Math.random().toString(16).slice(2),
          x: c.dir === 1 ? c.x + c.w + 2 : c.x - 10,
          y: c.y + c.h * 0.5 - 24,
          w: 20,
          h: 20,
          vx: c.speed * c.dir,
          vy: 0,
          alive: true,
          dir: c.dir,
          from: "enemy",
        });
      }
    }

    if (level.door.open && aabb(human, level.door)) {
      events.onWin?.();
      return;
    }

    if (human.y > H + 260) {
      human.hp = 0;
      human.dead = true;
      human.deadT = 2.0;
      events.onLose?.();
      human.hurtT = Math.max(human.hurtT, 0.6);
      return;
    }
    for (const box of level.boxes) {
      if (box.y > H + 320) {
        events.onLose?.();
        resetLevel();
        return;
      }
    }

    const coinsTotal = coins.length;
    const coinsGot = coins.filter((c) => c.collected).length;

    events.onUI({
      hp: human.hp,
      enemiesLeft: level.enemies.filter((e: any) => e.alive && e.hp > 0).length + (bossAlive ? 1 : 0),
      doorOpen: level.door.open,
      coins: coinsGot,
      coinsTotal,
    });
  }

  function draw(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = "#94a3b8";
    for (const p of level.platforms) ctx.fillRect(p.x, p.y, p.w, p.h);

    const moving: MovingPlatform[] = ((level as any).movingPlatforms ?? []) as MovingPlatform[];
    if (moving.length) {
      ctx.fillStyle = "#38bdf8";
      for (const mp of moving) ctx.fillRect(mp.x, mp.y, mp.w, mp.h);
    }

    ctx.fillStyle = "#22c55e";
    for (const t of ((level as any).trampolines ?? []) as any[]) {
      ctx.fillRect(t.x, t.y, t.w, t.h);
    }

    const spikes: Spike[] = (((level as any).spikes ?? []) as Spike[]);
    if (spikes.length) {
      ctx.fillStyle = "#ef4444";
      for (const s of spikes) ctx.fillRect(s.x, s.y, s.w, s.h);
    }

    const lasers = ((level as any).lasers ?? []) as any[];
    for (const l of lasers) {
      ctx.fillStyle = l.on ? "#ff2d2d" : "rgba(255,45,45,0.25)";
      ctx.fillRect(l.x, l.y, l.w, l.h);
    }

    const cannons = ((level as any).cannons ?? []) as any[];
    ctx.fillStyle = "#111827";
    for (const c of cannons) ctx.fillRect(c.x, c.y, c.w, c.h);

    for (const s of level.switches) {
      ctx.fillStyle = s.pressed ? "#10b981" : "#f59e0b";
      ctx.fillRect(s.x, s.y, s.w, s.h);
    }

    ctx.fillStyle = level.door.open ? "rgba(34,197,94,0.7)" : "rgba(59,130,246,0.7)";
    ctx.fillRect(level.door.x, level.door.y, level.door.w, level.door.h);

    for (const e of level.enemies as any[]) {
      if (!e.alive) continue;
      ctx.fillStyle = e.flying ? "#a78bfa" : "#fb7185";
      ctx.fillRect(e.x, e.y, e.w, e.h);
    }

    const boss = (level as any).boss as any | undefined;
    if (boss && boss.alive && boss.hp > 0) {
      ctx.fillStyle =
        boss.invulnT > 0 ? "#fde047" : boss.phase === 3 ? "#ef4444" : boss.phase === 2 ? "#fb7185" : "#f97316";
      ctx.fillRect(boss.x, boss.y, boss.w, boss.h);

      const bw = 260;
      const bh = 10;
      const x = (W - bw) * 0.5;
      const y = 26;

      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(x, y, bw, bh);

      const pct = clamp(boss.hp / Math.max(1, boss.maxHp), 0, 1);
      ctx.fillStyle = "#f97316";
      ctx.fillRect(x, y, bw * pct, bh);
    }

    ctx.fillStyle = "#64748b";
    for (const b of level.boxes) ctx.fillRect(b.x, b.y, b.w, b.h);

    const coins: Coin[] = (((level as any).coins ?? []) as Coin[]);
    if (coins.length) {
      ctx.fillStyle = "#facc15";
      for (const c of coins) {
        if (c.collected) continue;
        ctx.fillRect(c.x, c.y, c.w, c.h);
      }
    }

    for (const b of bullets) {
      if (!b.alive) continue;
      ctx.fillStyle = b.from === "enemy" ? "#fb7185" : "#facc15";
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    ctx.fillStyle = "#6366f1";
    ctx.fillRect(human.x, human.y, human.w, human.h);

    if (shieldEnabled && human.shielding && human.shield > 0) {
      ctx.fillStyle = human.shieldHitT > 0 ? "rgba(56,189,248,0.95)" : "rgba(56,189,248,0.65)";
      const sw = 10;
      const sh = 22;
      const sx = human.facing === 1 ? human.x + human.w + 2 : human.x - sw - 2;
      const sy = human.y + (human.h - sh) * 0.5;
      ctx.fillRect(sx, sy, sw, sh);
    }

    if (shieldEnabled) {
      const sbW = 120;
      const sbH = 8;
      const sbX = 18;
      const sbY = 40;

      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(sbX, sbY, sbW, sbH);

      ctx.fillStyle = human.shielding ? "#38bdf8" : "#60a5fa";
      ctx.fillRect(sbX, sbY, sbW * clamp(human.shield / 100, 0, 1), sbH);
    }

    const maxHP = MAX_HP;
    const heartSize = 12;
    const gap = 5;
    const startX = 18;
    const startY = 18;

    // Level 10: 2 rows of 10 hearts, others: single row
    const perRow = levelId === 10 ? 10 : maxHP;

    for (let i = 0; i < maxHP; i++) {
      const col = i % perRow;
      const row = Math.floor(i / perRow);

      const x = startX + col * (heartSize + gap);
      const y = startY + row * (heartSize + gap);

      // background heart
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(x, y, heartSize, heartSize);

      // filled heart
      if (i < human.hp) {
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(x, y, heartSize, heartSize);
      }
    }
  }

  function getState() {
    return { level, human, bullets, impacts };
  }

  return { step, draw, resetLevel, getState };

}
