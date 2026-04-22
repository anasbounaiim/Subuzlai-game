import type { GameImages } from "./load";
import { TILE, CHARS, WORLD } from "./atlas";
import { drawSprite, drawTiledRect } from "./draw";
import type { Rect, Spike } from "../engine/types";
import { W as WORLD_W, H as WORLD_H } from "../engine/constants";

type EngineState = {
  level: any;
  levelId?: number;
  human: any;
  bullets: any[];
  impacts?: any[];
  deaths?: number;
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

const UI = {
  mist: "#8e8a98",
  pink: "#cf73e6",
  ink: "#17131f",
  plum: "#343140",
  lilac: "#cf86ff",
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
};
let particles: Particle[] = [];
let playerBulletSprite: { sx: number; sy: number; sw: number; sh: number } | null = null;

export let camX = -1;
export let camY = -1;
export function resetCamera() {
  camX = -1;
  camY = -1;
}

function spawnParticles(x: number, y: number, count: number, color = "#FFF1E8") {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 150,
      vy: (Math.random() - 0.5) * 150,
      life: 1.0,
      size: 4 + Math.floor(Math.random() * 4), // Blocky sizes
      color,
    });
  }
}

function updateParticles(dt: number) {
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt * 2.5;
  }
}

function drawParallaxLayer(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  tSec: number,
  W: number,
  H: number,
  speed: number
) {
  const scale = H / img.height;
  const drawW = Math.ceil(img.width * scale);
  if (drawW <= 0) return;

  const offset = -Math.floor((tSec * speed) % drawW);
  for (let x = offset; x < W; x += drawW) {
    ctx.drawImage(img, x, 0, drawW, H);
  }
}

function drawParallaxBackground(
  ctx: CanvasRenderingContext2D,
  images: GameImages | null,
  tSec: number,
  W: number,
  H: number
) {
  ctx.fillStyle = UI.ink;
  ctx.fillRect(0, 0, W, H);

  if (!images) return;

  drawParallaxLayer(ctx, images.bgSky, tSec, W, H, 7);
  drawParallaxLayer(ctx, images.bgCityFar, tSec, W, H, 15);
  drawParallaxLayer(ctx, images.bgCityNear, tSec, W, H, 22);
  drawParallaxLayer(ctx, images.bgDetail, tSec, W, H, 34);
  drawParallaxLayer(ctx, images.bgTrees, tSec, W, H, 48);

  ctx.save();
  ctx.fillStyle = "rgba(5, 6, 14, 0.2)";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  images: GameImages | null,
  st: EngineState,
  tSec: number,
  W: number,
  H: number
) {
  // Ensure crisp pixel rendering
  ctx.imageSmoothingEnabled = false;

  ctx.clearRect(0, 0, W, H);
  drawParallaxBackground(ctx, images, tSec, W, H);

  // 8-bit style rect helper
  function rect(x: number, y: number, w: number, h: number, fill: string, stroke?: string, outlineWidth = 2) {
    const fx = Math.floor(x);
    const fy = Math.floor(y);
    const fw = Math.floor(w);
    const fh = Math.floor(h);

    ctx.fillStyle = fill;
    ctx.fillRect(fx, fy, fw, fh);
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = outlineWidth;
      ctx.strokeRect(fx, fy, fw, fh);
    }
  }

  if (!images) return;
  const spikeImg = images.spikes;
  const laserImg = images.laser;
  const cannonBulletsImg = images.cannon_bullets;
  const playerBulletImg = images.player_bullet;
  const tilesImg = images.tiles;
  const tileHImg = images.tile_h;
  const TRAMPOLINE_FRAME_ASPECT = 496 / (2200 / 3);

  function drawTileHRect(x: number, y: number, w: number, h: number) {
    if (w <= 0 || h <= 0) return;

    const pattern = ctx.createPattern(tileHImg, "repeat");
    if (!pattern) return;

    ctx.save();
    ctx.translate(Math.floor(x), Math.floor(y));
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, Math.floor(w), Math.floor(h));
    ctx.restore();
  }

  function drawMapFrame(x: number, y: number, w: number, h: number) {
    if (w <= 0 || h <= 0) return;

    const pattern = ctx.createPattern(tileHImg, "repeat");
    if (!pattern) return;

    ctx.save();
    const fx = Math.floor(x);
    const fy = Math.floor(y);
    const fw = Math.floor(w);
    const fh = Math.floor(h);
    const frame = 32;

    ctx.fillStyle = pattern;
    ctx.fillRect(fx - frame, fy, frame, fh);
    ctx.fillRect(fx + fw, fy, frame, fh);
    ctx.restore();
  }

  function drawPlatform(p: Rect) {
    const x = Math.floor(p.x);
    const y = Math.floor(p.y);
    const w = Math.floor(p.w);
    const h = Math.floor(p.h);

    if (h <= TILE) {
      drawTiledRect(ctx, tilesImg, WORLD.tile_brick, x, y, w, h);
      return;
    }

    const topH = TILE;
    const bodyY = y + topH;
    const bodyH = h - topH;

    drawTileHRect(x, bodyY, w, bodyH);

    drawTiledRect(ctx, tilesImg, WORLD.tile_brick, x, y, w, topH);
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

  function getPlayerBulletSprite() {
    if (playerBulletSprite) return playerBulletSprite;

    const img = playerBulletImg;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.drawImage(img, 0, 0);

    const data = tempCtx.getImageData(0, 0, img.width, img.height).data;
    let minX = img.width;
    let minY = img.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const alpha = data[(y * img.width + x) * 4 + 3];
        if (alpha <= 8) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    playerBulletSprite =
      maxX >= minX && maxY >= minY
        ? { sx: minX, sy: minY, sw: maxX - minX + 1, sh: maxY - minY + 1 }
        : { sx: 0, sy: 0, sw: img.width, sh: img.height };

    return playerBulletSprite;
  }

  function drawSpikeStrip(spike: Spike) {
    const dir =
      spike.dir ??
      (spike.h > spike.w ? "left" : "up");
    const tile = 32;

    if (dir === "up" || dir === "down") {
      const count = Math.max(1, Math.ceil(spike.w / tile));
      for (let i = 0; i < count; i++) {
        const segX = Math.floor(spike.x + i * tile);
        const segW = Math.min(tile, Math.floor(spike.x + spike.w - segX));
        if (segW <= 0) continue;

        ctx.save();
        if (dir === "down") {
          ctx.translate(segX + segW / 2, Math.floor(spike.y + spike.h / 2));
          ctx.rotate(Math.PI);
          ctx.drawImage(
            spikeImg,
            0,
            0,
            spikeImg.width,
            spikeImg.height,
            -segW / 2,
            -spike.h / 2,
            segW,
            spike.h
          );
        } else {
          ctx.drawImage(
            spikeImg,
            0,
            0,
            spikeImg.width,
            spikeImg.height,
            segX,
            Math.floor(spike.y),
            segW,
            spike.h
          );
        }
        ctx.restore();
      }
      return;
    }

    const count = Math.max(1, Math.ceil(spike.h / tile));
    for (let i = 0; i < count; i++) {
      const segY = Math.floor(spike.y + i * tile);
      const segH = Math.min(tile, Math.floor(spike.y + spike.h - segY));
      if (segH <= 0) continue;

      ctx.save();
      ctx.translate(Math.floor(spike.x + spike.w / 2), segY + segH / 2);
      ctx.rotate(dir === "left" ? -Math.PI / 2 : Math.PI / 2);
      ctx.drawImage(
        spikeImg,
        0,
        0,
        spikeImg.width,
        spikeImg.height,
        -spike.w / 2,
        -segH / 2,
        spike.w,
        segH
      );
      ctx.restore();
    }
  }

  function drawLaserBeam(l: any) {
    const frameXs = [0, 139, 278, 417];
    const frameWs = [139, 139, 139, 140];
    const frameH = laserImg.height;
    const frameIdx = Math.floor(tSec * 10) % frameXs.length;
    const sx = frameXs[frameIdx];
    const frameW = frameWs[frameIdx];

    if (l.dir === "h") {
      const beamX = Math.floor(l.x + 16);
      const beamY = Math.floor(l.y);
      const beamW = Math.max(0, Math.floor(l.w - 32));
      const beamH = Math.floor(l.h);
      if (beamW <= 0 || beamH <= 0) return;

      ctx.save();
      ctx.translate(beamX + beamW * 0.5, beamY + beamH * 0.5);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(laserImg, sx, 0, frameW, frameH, -beamH * 0.5, -beamW * 0.5, beamH, beamW);
      ctx.restore();
      return;
    }

    const beamX = Math.floor(l.x);
    const beamY = Math.floor(l.y + 16);
    const beamW = Math.floor(l.w);
    const beamH = Math.max(0, Math.floor(l.h - 32));
    if (beamW <= 0 || beamH <= 0) return;

    const aspectW = Math.max(8, Math.round((frameW / frameH) * beamH));
    const drawW = Math.min(beamW, aspectW);
    const drawX = beamX + Math.floor((beamW - drawW) * 0.5);

    ctx.drawImage(laserImg, sx, 0, frameW, frameH, drawX, beamY, drawW, beamH);
  }

  function drawKeycap(x: number, y: number, w: number, h: number, label: string) {
    rect(x, y, w, h, "rgba(32,29,45,0.94)", "#fff7ff", 3);
    rect(x + 4, y + 4, w - 8, 7, "rgba(255,247,255,0.16)");

    ctx.save();
    ctx.fillStyle = "#fff7ff";
    ctx.font = "16px var(--font-pixel), 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#04193f";
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur = 0;
    ctx.fillText(label, Math.floor(x + w / 2), Math.floor(y + h / 2 + 1));
    ctx.restore();
  }

  function drawArrowKeycap(x: number, y: number, dir: "left" | "up" | "right", size: number) {
    drawKeycap(x, y, size, size, "");

    const cx = Math.floor(x + size / 2);
    const cy = Math.floor(y + size / 2);
    const unit = Math.max(3, Math.floor(size / 9));
    const blocks =
      dir === "up"
        ? [
            [0, -3], [-1, -2], [0, -2], [1, -2],
            [-2, -1], [0, -1], [2, -1],
            [0, 0], [0, 1], [0, 2],
          ]
        : dir === "left"
          ? [
              [-3, 0], [-2, -1], [-2, 0], [-2, 1],
              [-1, -2], [-1, 0], [-1, 2],
              [0, 0], [1, 0], [2, 0],
            ]
          : [
              [3, 0], [2, -1], [2, 0], [2, 1],
              [1, -2], [1, 0], [1, 2],
              [0, 0], [-1, 0], [-2, 0],
            ];

    ctx.save();
    ctx.fillStyle = "#fff7ff";
    ctx.shadowColor = "#04193f";
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 0;
    for (const [bx, by] of blocks) {
      ctx.fillRect(cx + bx * unit - Math.floor(unit / 2), cy + by * unit - Math.floor(unit / 2), unit, unit);
    }
    ctx.restore();
  }

  function drawHintLabel(text: string, x: number, y: number, width: number) {
    ctx.save();
    ctx.fillStyle = "#fff7ff";
    ctx.font = "4px var(--font-pixel), 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "#04193f";
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 0;
    ctx.fillText(text, Math.floor(x + width / 2), y);
    ctx.restore();
  }

  function drawLevelOneControlsHint() {
    if (st.levelId !== 1) return;

    const firstRaisedPlatform = ((level as any).platforms ?? []).find((p: Rect) => p.y < WORLD_H - 80);
    if (!firstRaisedPlatform) return;

    const x = Math.floor(firstRaisedPlatform.x + 6);
    const y = Math.floor(firstRaisedPlatform.y - 128);
    const key = 28;
    const gap = 10;
    const moveW = key * 3 + gap * 2;
    const groupGap = 42;
    const shootX = x + moveW + groupGap;
    const shieldX = shootX + 50 + groupGap;

    ctx.save();
    ctx.globalAlpha = 0.96;
    drawArrowKeycap(x, y + key + gap, "left", key);
    drawArrowKeycap(x + key + gap, y, "up", key);
    drawArrowKeycap(x + (key + gap) * 2, y + key + gap, "right", key);
    drawHintLabel("MOVE", x, y + key * 2 + gap * 2 + 6, moveW);
    drawHintLabel("JUMP", x, y + key * 2 + gap * 2 + 20, moveW);

    drawKeycap(shootX, y + key + gap, 44, key, "Q");
    drawHintLabel("SHOOT", shootX, y + key * 2 + gap * 2 + 6, 44);

    drawKeycap(shieldX, y + key + gap, 44, key, "C");
    drawHintLabel("SHIELD", shieldX, y + key * 2 + gap * 2 + 6, 44);
    drawHintLabel("BOSS", shieldX, y + key * 2 + gap * 2 + 20, 44);
    ctx.restore();
  }

  const { level, human, bullets } = st;
  // Update particles locally
  updateParticles(0.016);

  // Vintage scanline effect (optional, simplified)
  // Disable old vignette for pixel clarity

  const cx = human.x + human.w / 2;
  const cy = human.y + human.h / 2;
  
  if (camX === -1) {
    camX = cx;
    camY = cy;
  } else {
    // Lerp smooth follow
    camX += (cx - camX) * 0.1;
    camY += (cy - camY) * 0.1;
  }

  const ZOOM = 1.2;

  ctx.save();
  // Anchor view to center of screen
  ctx.translate(W / 2, H / 2);
  ctx.scale(ZOOM, ZOOM);
  // Unanchor camera from actual position
  ctx.translate(-camX, -camY);

  // platforms
  for (const p of ((level as any).platforms ?? []) as Rect[]) {
    drawPlatform(p);
  }

  drawLevelOneControlsHint();

  // moving platforms
  for (const mp of ((level as any).movingPlatforms ?? []) as Rect[]) {
    drawTiledRect(ctx, images.tiles, WORLD.tile_ground, Math.floor(mp.x), Math.floor(mp.y), Math.floor(mp.w), Math.floor(mp.h));
  }

  // trampolines
  for (const tr of ((level as any).trampolines ?? []) as any[]) {
    const bounceT = tr.bounceT ?? 0;
    const bnc = bounceT > 0 ? 4 : 0;
    const trampolineFrames = 3;
    const frameWidth = Math.floor(images.trampoline.width / trampolineFrames);
    const frameIdx = bounceT > 0.08 ? 1 : bounceT > 0 ? 2 : 0;
    const trSpr = {
      sx: frameIdx * frameWidth,
      sy: 0,
      sw: frameWidth,
      sh: images.trampoline.height,
    };

    const frameAspect = images.trampoline.height / frameWidth;
    const drawW = Math.max(tr.w + 14, Math.round(tr.w * 1.18));
    const drawH = Math.round(drawW * frameAspect);
    const drawX = Math.round(tr.x + (tr.w - drawW) * 0.5);
const drawY = Math.round(tr.y + tr.h - drawH - 35 + bnc);

    drawSprite(
      ctx,
      images.trampoline,
      trSpr,
      drawX,
      drawY,
      drawW,
      drawH
    );
  }

  // spikes
  for (const s of ((level as any).spikes ?? []) as Spike[]) {
    drawSpikeStrip(s);
  }

  // lasers
  for (const l of ((level as any).lasers ?? []) as any[]) {
    if (l.on) {
      drawLaserBeam(l);
    }
  }

  // keys (switches)
  for (const sw of (level.switches ?? []) as any[]) {
    if (sw.pressed) continue; // Key behavior: hide once collected
    const kFrames = 4;
    const kIdx = Math.floor(tSec * 6) % kFrames;
    // The sheet has frames every 16 pixels. Using sw: 16 to capture only one key.
    const kSpr = { sx: kIdx * 16, sy: 0, sw: 16, sh: 16 };
    drawSprite(ctx, images.key, kSpr, Math.floor(sw.x), Math.floor(sw.y), Math.floor(sw.w), Math.floor(sw.h));
  }

  // cannons
  for (const cn of ((level as any).cannons ?? []) as any[]) {
    const fireT = cn.fireT ?? 0;
    const recoil = fireT > 0 ? (1 - fireT / 0.12) * 4 : 0;
    const drawW = Math.max(cn.w, 56);
    const drawH = Math.max(cn.h, 56);
    const drawX = Math.floor(cn.x + (cn.w - drawW) * 0.5 - cn.dir * recoil);
    const drawY = Math.floor(cn.y + cn.h - drawH + (fireT > 0 ? 1 : 0));

    drawSprite(ctx, images.cannon, { sx: 0, sy: 0, sw: images.cannon.width, sh: images.cannon.height }, drawX, drawY, drawW, drawH, cn.dir === -1);

    if (fireT > 0) {
      const pulse = clamp(fireT / 0.12, 0, 1);
      const flashSize = 10 + (1 - pulse) * 10;
      const flashX = cn.dir === 1 ? drawX + drawW - 6 : drawX + 6;
      const flashY = drawY + drawH * 0.4;

      ctx.save();
      ctx.globalAlpha = pulse * 0.9;
      ctx.fillStyle = "#fff4cf";
      ctx.beginPath();
      ctx.arc(flashX, flashY, flashSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff9b3d";
      ctx.beginPath();
      ctx.arc(flashX, flashY, flashSize * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // door (chest)
  const door = level.door as any;
  if (door) {
    const cFrames = 2; // Assuming 2 frames: closed and open
    const cIdx = door.open ? 1 : 0; 
    const cSpr = { sx: cIdx * 32, sy: 0, sw: 32, sh: 32 };
    // Use the actual door width and height from the level
    drawSprite(ctx, images.chest, cSpr, Math.floor(door.x), Math.floor(door.y + door.h - door.h), Math.floor(door.w), Math.floor(door.h));
  }

  // coins
  for (const c of (level.coins ?? []) as any[]) {
    if (c.collected) continue;
    // coins (using Coin.png)
    const coinFrames = 6; // Most standard rotation sheets use 6 distinct frames
    const cIdx = Math.floor(tSec * 8) % coinFrames;
    const cSpr = { sx: cIdx * 32, sy: 0, sw: 32, sh: 32 };
    drawSprite(ctx, images.coin, cSpr, Math.floor(c.x), Math.floor(c.y), Math.floor(c.w), Math.floor(c.h));
  }

  // boxes
  for (const b of (level.boxes ?? []) as any[]) {
    ctx.drawImage(images.box, Math.floor(b.x), Math.floor(b.y), Math.floor(b.w), Math.floor(b.h));
  }

  // enemies
  for (const e of level.enemies as any[]) {
    if (!e.alive) continue;
    
    let enemyImg = images.enemy_walk;
    let eFrames = 6;
    let eFps = 10;
    
    if (Math.abs(e.vx) < 5) { // Practically stationary
      enemyImg = images.enemy_idle;
      eFrames = 4;
      eFps = 6;
    }
    
    const eFrameIdx = Math.floor(tSec * eFps) % eFrames;
    // Red sprites are typically 32x32
    const eSpr = { sx: eFrameIdx * 32, sy: 0, sw: 32, sh: 32 };
    drawSprite(ctx, enemyImg, eSpr, Math.floor(e.x), Math.floor(e.y), Math.floor(e.w), Math.floor(e.h), e.vx > 0);

    const maxEnemyHp = Math.max(1, e.maxHp ?? e.hp ?? 1);
    const enemyHpPct = clamp((e.hp ?? maxEnemyHp) / maxEnemyHp, 0, 1);
    const barW = Math.max(20, Math.floor(e.w));
    const barH = 5;
    const barX = Math.floor(e.x + (e.w - barW) * 0.5);
    const barY = Math.floor(e.y - 10);

    rect(barX - 1, barY - 1, barW + 2, barH + 2, "#000000");
    rect(barX, barY, barW, barH, "#ef4444");
    rect(barX, barY, Math.floor(barW * enemyHpPct), barH, "#22c55e");
  }

  // boss
  const boss = (level as any).boss;
  if (boss) { // Render even if technically "dead" to show the body
    if (boss.invulnT > 0 && boss.hp > 0) ctx.globalAlpha = 0.5;

    let bossImg = images.boss_idle;
    let bFrames = 1;
    let bFps = 4;
    let loop = true;
    
    if (boss.hp <= 0 || !boss.alive) {
      bossImg = images.boss_death;
      bFrames = 4;
      bFps = 6;
      loop = false;
    } else if (boss.invulnT > 0.05) {
      bossImg = images.boss_hurt;
      bFrames = 4;
      bFps = 8;
    } else if (boss.state === "patrol" || Math.abs(boss.vx) > 5) {
      // Running animation (use boss_run)
      bossImg = images.boss_run;
      bFrames = 8;
      bFps = 12;
    } else if (boss.state === "telegraph") {
      // Attack animation (use attack4)
      bossImg = images.boss_attack4;
      bFrames = 4;
      bFps = 8;
    } else if (boss.state === "slam") {
      bossImg = images.boss_attack2; 
      bFrames = 8;
      bFps = 10;
    } else if (boss.state === "shoot") {
      bossImg = images.boss_attack3; 
      bFrames = 6;
      bFps = 12;
    } else if (boss.state === "dash") {
      // Dash also uses running animation
      bossImg = images.boss_run;
      bFrames = 8;
      bFps = 12;
    }

    const bFrameIdx = loop 
      ? Math.floor(tSec * bFps) % bFrames 
      : Math.min(bFrames - 1, Math.floor(tSec * bFps)); 
    const bSpr = { sx: bFrameIdx * 96, sy: 0, sw: 96, sh: 96 };
    
    // Default Demon Boss faces Left.
    // Flip it horizontally (bFlip=true) if the player is to the right of the boss!
    const dirToPlayer = human.x + human.w * 0.5 >= boss.x + boss.w * 0.5 ? 1 : -1;
    const bFlip = dirToPlayer > 0;
    
    const drawW = 144;
    const drawH = 144;
    const bx = boss.x + boss.w / 2 - drawW / 2;
    const by = boss.y + boss.h - drawH + 8;
    
    drawSprite(ctx, bossImg ?? images.chars, bSpr, Math.floor(bx), Math.floor(by), drawW, drawH, bFlip);
    
    ctx.globalAlpha = 1.0;
  }

  // boss bullets
  if (boss && boss.bullets) {
    for (const b of boss.bullets) {
      const drawSize = Math.max(b.w, b.h) + 18;
      drawSprite(
        ctx,
        images.boss_bullet,
        { sx: 0, sy: 0, sw: images.boss_bullet.width, sh: images.boss_bullet.height },
        Math.floor(b.x + b.w * 0.5 - drawSize * 0.5),
        Math.floor(b.y + b.h * 0.5 - drawSize * 0.5),
        drawSize,
        drawSize
      );
    }
  }

  // bullets
  for (const b of (st.bullets ?? []) as any[]) {
    if (typeof b.id === "string" && b.id.startsWith("bb_")) {
      const drawSize = Math.max(b.w, b.h) + 18;
      drawSprite(
        ctx,
        images.boss_bullet,
        { sx: 0, sy: 0, sw: images.boss_bullet.width, sh: images.boss_bullet.height },
        Math.floor(b.x + b.w * 0.5 - drawSize * 0.5),
        Math.floor(b.y + b.h * 0.5 - drawSize * 0.5),
        drawSize,
        drawSize
      );
      continue;
    }

    if (typeof b.id === "string" && b.id.startsWith("cb_")) {
      const drawSize = 36;
      const cx = b.x + b.w * 0.5;
      const cy = b.y + b.h * 0.5;
      const spin = tSec * 4 * (b.dir === -1 ? -1 : 1);

      ctx.save();
      ctx.translate(Math.floor(cx), Math.floor(cy));
      ctx.rotate(spin);
      ctx.drawImage(
        cannonBulletsImg,
        0,
        0,
        cannonBulletsImg.width,
        cannonBulletsImg.height,
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize
      );
      ctx.restore();
      continue;
    }

    if (typeof b.id === "string" && b.id.startsWith("eb_")) {
      const drawSize = 22;
      const cx = b.x + b.w * 0.5;
      const cy = b.y + b.h * 0.5;
      const spin = tSec * 6 * (b.dir === -1 ? -1 : 1);

      ctx.save();
      ctx.translate(Math.floor(cx), Math.floor(cy));
      ctx.rotate(spin);
      ctx.drawImage(
        cannonBulletsImg,
        0,
        0,
        cannonBulletsImg.width,
        cannonBulletsImg.height,
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize
      );
      ctx.restore();
      continue;
    }

    if (b.from === "player") {
      const spr = getPlayerBulletSprite();
      const drawSize = 24;
      const cx = b.x + b.w * 0.5;
      const cy = b.y + b.h * 0.5 - 8;
      const spin = tSec * 8 * (b.dir === -1 ? -1 : 1);

      ctx.save();
      ctx.translate(Math.floor(cx), Math.floor(cy));
      ctx.rotate(spin);
      if (b.dir === -1) ctx.scale(-1, 1);

      ctx.drawImage(
        playerBulletImg,
        spr.sx,
        spr.sy,
        spr.sw,
        spr.sh,
        -drawSize / 2,
        -drawSize / 2,
        drawSize,
        drawSize
      );
      ctx.restore();
      continue;
    }

    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
    ctx.fillStyle = b.fromPlayer ? "#00E436" : "#FF004D";
    ctx.fill();
  }

  for (const hit of (st.impacts ?? []) as any[]) {
    const alpha = clamp(hit.t / 0.12, 0, 1);
    const size = hit.kind === "boss" ? 14 + (1 - alpha) * 18 : 10 + (1 - alpha) * 14;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = hit.kind === "boss" ? "#fff1b8" : "#fff6d5";
    ctx.beginPath();
    ctx.arc(hit.x, hit.y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hit.kind === "boss" ? "#ff3b1f" : "#ff7447";
    ctx.lineWidth = hit.kind === "boss" ? 4 : 3;
    ctx.stroke();

    if (hit.kind === "boss") {
      ctx.fillStyle = "#ff8c1a";
      ctx.beginPath();
      ctx.arc(hit.x, hit.y, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // player
  let playerImg = images.player_idle;
  let frameCount = 4;
  let fps = 8;
  
  // Shield Effect
  if (human.shielding && human.shieldT > 0) {
    ctx.save();
    const shieldFrames = 8;
    const shieldFrameW = Math.floor(images.shield.width / shieldFrames);
    const shieldFrameH = images.shield.height;
    const shieldFrame = Math.floor(tSec * 12) % shieldFrames;
    const shieldSize = 66;
    const sx = shieldFrame * shieldFrameW;
    const dx = human.x + human.w * 0.5 - shieldSize * 0.5;
    const dy = human.y + human.h * 0.5 - shieldSize * 0.5;

    ctx.drawImage(
      images.shield,
      sx,
      0,
      shieldFrameW,
      shieldFrameH,
      Math.floor(dx),
      Math.floor(dy),
      Math.floor(shieldSize),
      Math.floor(shieldSize)
    );
    ctx.restore();
  }
  
  if (human.hurtT > 0) {
    playerImg = images.player_hurt;
    frameCount = 4;
    fps = 10;
  } else if (Math.abs(human.vx) > 10) {
    playerImg = images.player_run;
    frameCount = 6;
    fps = 12;
  }
  if (human.hurtT <= 0 && (human.vy < -10 || human.vy > 10)) { // jump or fall
    playerImg = images.player_jump;
    frameCount = 8;
    fps = 12;
  }
  if (human.hurtT <= 0 && human.dashT && human.dashT > 0) {
    playerImg = images.player_run;
    frameCount = 6;
    fps = 20; // faster animation for dash
  }

  const frameIdx = Math.floor(tSec * fps) % frameCount;
  
  // Pink Monster sprite sheet layout
  const pSpr = { sx: frameIdx * 32, sy: 0, sw: 32, sh: 32 };
  
  drawSprite(
    ctx, 
    playerImg, 
    pSpr, 
    Math.floor(human.x), 
    Math.floor(human.y), 
    Math.floor(human.w), 
    Math.floor(human.h), 
    human.facing === -1
  );

  // particles (8-bit squares)
  for (const p of particles) {
    ctx.globalAlpha = p.life * 0.8;
    rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, p.color);
    ctx.globalAlpha = 1;
  }

  drawMapFrame(0, 0, WORLD_W, WORLD_H);

  // End of camera transformation
  ctx.restore();

  if (human.dead && human.deadT > 0) {
    const deathElapsed = 2 - human.deadT;
    const pulse = Math.max(0, Math.sin(deathElapsed * Math.PI * 10));
    const alpha = 0.08  + pulse * 0.35 ; // Base 0.8, pulse up to 2.0

    ctx.save();
    ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // HUD - Player HP and Coins
  const hudX = 18, hudY = 16;
  const currentHP = human.hp;
  const maxHP = human.maxHp ?? 5;
  const hpPct = clamp(currentHP / Math.max(1, maxHP), 0, 1);
  const barX = hudX;
  const barY = hudY + 11;
  const barW = 180;
  const barH = 24;

  ctx.save();
  rect(barX - 4, barY - 4, barW + 8, barH + 8, "rgba(26,18,44,0.88)", "#24173a", 2);
  rect(barX, barY, barW, barH, "#5f3c8f");
  rect(barX, barY, Math.floor(barW * hpPct), barH, "#d690ff");
  rect(barX, barY, Math.floor(barW * hpPct), 7, "rgba(255,232,255,0.28)");
  ctx.restore();

  ctx.fillStyle = "#f7e7ff";
  ctx.font = "bold 10px 'Press Start 2P', 'Courier New', Courier, monospace";
  ctx.fillText(`HP ${currentHP}/${maxHP}`, barX + 12, barY + 16);

  let nextHudY = barY + barH + 10;

  if (human.shieldEnabled) {
    const shieldBarY = nextHudY;
    const shieldPct = human.shielding ? (human.shieldActivePct ?? 0) : (human.shieldReadyPct ?? 1);
    const shieldColor = human.shielding ? "#58e6ff" : human.shieldCD > 0 ? "#64748b" : "#38bdf8";
    const shieldText = human.shielding
      ? `SHIELD ${Math.ceil(human.shieldT ?? 0)}s`
      : human.shieldCD > 0
        ? `RELOAD ${Math.ceil(human.shieldCD)}s`
        : "SHIELD READY";

    rect(barX - 3, shieldBarY - 3, barW + 6, 13, "rgba(10,22,38,0.78)", "#163b55", 1);
    rect(barX, shieldBarY, barW, 7, "#132b42");
    rect(barX, shieldBarY, Math.floor(barW * clamp(shieldPct, 0, 1)), 7, shieldColor);

    ctx.fillStyle = "#dffaff";
    ctx.font = "bold 8px 'Press Start 2P', 'Courier New', Courier, monospace";
    ctx.fillText(shieldText, barX + 8, shieldBarY + 23);

    nextHudY = shieldBarY + 36;
  }

  if (boss && boss.alive && boss.hp > 0) {
    const bossPct = clamp(boss.hp / Math.max(1, boss.maxHp ?? 20), 0, 1);
    const bossBarW = barW;
    const bossBarH = 24;
    const bossBarX = barX;
    const bossBarY = nextHudY + 14;

    ctx.save();
    rect(bossBarX - 4, bossBarY - 4, bossBarW + 8, bossBarH + 8, "rgba(49,12,18,0.9)", "#3a1118", 2);
    rect(bossBarX, bossBarY, bossBarW, bossBarH, "#6f1822");
    rect(bossBarX, bossBarY, Math.floor(bossBarW * bossPct), bossBarH, "#ff5a68");
    rect(bossBarX, bossBarY, Math.floor(bossBarW * bossPct), 7, "rgba(255,236,220,0.24)");
    ctx.restore();

    ctx.fillStyle = "#ffe6e6";
    ctx.font = "bold 10px 'Press Start 2P', 'Courier New', Courier, monospace";
    ctx.fillText(`BOSS ${boss.hp}/${boss.maxHp ?? 20}`, bossBarX + 10, bossBarY + 16);
  }

  // Stats text
  const got = (level.coins ?? []).filter((c: any) => c.collected).length;
  ctx.fillStyle = UI.mist;
  ctx.font = "bold 16px 'Press Start 2P', 'Courier New', Courier, monospace";
  ctx.fillText(`COINS: ${got}`, barX + barW + 26, hudY + 30);
}
