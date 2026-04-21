export type Sprite = { sx: number; sy: number; sw: number; sh: number };

export function setPixelArt(ctx: CanvasRenderingContext2D) {
  // Crisp pixels
  (ctx as any).imageSmoothingEnabled = false;
  (ctx as any).mozImageSmoothingEnabled = false;
  (ctx as any).webkitImageSmoothingEnabled = false;
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  spr: Sprite,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  flipX = false,
  alpha = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;

  if (flipX) {
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(img, spr.sx, spr.sy, spr.sw, spr.sh, 0, 0, dw, dh);
  } else {
    ctx.drawImage(img, spr.sx, spr.sy, spr.sw, spr.sh, dx, dy, dw, dh);
  }

  ctx.restore();
}

// Cache for patterns to avoid daily canvas creation
const patternCache = new Map<string, CanvasPattern>();

export function drawTiledRect(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  tile: Sprite,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const key = `${tile.sx}-${tile.sy}-${tile.sw}-${tile.sh}`;
  let pattern = patternCache.get(key);

  if (!pattern) {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = tile.sw;
    tempCanvas.height = tile.sh;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.drawImage(img, tile.sx, tile.sy, tile.sw, tile.sh, 0, 0, tile.sw, tile.sh);
    pattern = ctx.createPattern(tempCanvas, "repeat")!;
    patternCache.set(key, pattern);
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = pattern;
  // Translate the context to the object's position so the pattern anchors properly.
  // This solves texture sliding on moving platforms and ensures proper object alignment.
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export function drawGlowRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  tSec: number
) {
  const pulse = 0.55 + 0.45 * Math.sin(tSec * 10);

  // glow
  ctx.fillStyle = `rgba(255,80,80,${0.16 * pulse})`;
  ctx.fillRect(x - 5, y - 5, w + 10, h + 10);

  // core
  ctx.fillStyle = `rgba(255,60,60,0.92)`;
  ctx.fillRect(x, y, w, h);
}
