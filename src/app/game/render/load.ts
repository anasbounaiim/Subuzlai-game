export type GameImages = {
    chars: HTMLImageElement;
    player_idle: HTMLImageElement;
    player_run: HTMLImageElement;
    player_jump: HTMLImageElement;
    player_hurt: HTMLImageElement;
    player_bullet: HTMLImageElement;
    shield: HTMLImageElement;
    trampoline: HTMLImageElement;
    objects: HTMLImageElement;
    bg: HTMLImageElement;
    bgSky: HTMLImageElement;
    bgCityFar: HTMLImageElement;
    bgCityNear: HTMLImageElement;
    bgDetail: HTMLImageElement;
    bgTrees: HTMLImageElement;
    tiles: HTMLImageElement;
    tile_h: HTMLImageElement;

    boss_idle: HTMLImageElement;
    boss_walk: HTMLImageElement;
    boss_run: HTMLImageElement;
    boss_attack: HTMLImageElement; // attack1
    boss_attack2: HTMLImageElement;
    boss_attack3: HTMLImageElement;
    boss_attack4: HTMLImageElement;
    boss_death: HTMLImageElement;
    boss_hurt: HTMLImageElement;
    boss_bullet: HTMLImageElement;
    box: HTMLImageElement;
    spikes: HTMLImageElement;
    hp_frame: HTMLImageElement;
    laser: HTMLImageElement;
    cannon: HTMLImageElement;
    cannon_bullets: HTMLImageElement;
    chicken: HTMLImageElement;
    key: HTMLImageElement;
    chest: HTMLImageElement;
    coin: HTMLImageElement;
    enemy_idle: HTMLImageElement;
    enemy_walk: HTMLImageElement;
    enemy_hurt: HTMLImageElement;
    enemy_death: HTMLImageElement;
    enemy_attack: HTMLImageElement;
  };
  
  function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }
  
  export async function loadGameImages(): Promise<GameImages> {
    const [
      chars, player_idle, player_run, player_jump, player_hurt, player_bullet, shield,
      trampoline, objects, bg, bgSky, bgCityFar, bgCityNear, bgDetail, bgTrees, tiles, tile_h,
      boss_idle, boss_walk, boss_run, boss_attack, boss_attack2, boss_attack3, boss_attack4, boss_death, boss_hurt, boss_bullet,
      box, spikes, hp_frame, laser, cannon, cannon_bullets, chicken, key, chest, coin,
      enemy_idle, enemy_walk, enemy_hurt, enemy_death, enemy_attack
    ] = await Promise.all([
      loadImage("/cat.png"),
      loadImage("/Pink_Monster_Idle_4.png"),
      loadImage("/Pink_Monster_Run_6.png"),
      loadImage("/Pink_Monster_Jump_8.png"),
      loadImage("/Pink_Monster_Hurt_4.png"),
      loadImage("/player_bullet.png"),
      loadImage("/Shield.png"),
      loadImage("/trampolines.png"),
      loadImage("/Objects.png"),
      loadImage("/Background.png"),
      loadImage("/background/1.png"),
      loadImage("/background/2.png"),
      loadImage("/background/3.png"),
      loadImage("/background/4.png"),
      loadImage("/background/5.png"),
      loadImage("/Tiles.png"),
      loadImage("/Tile_h.png"),
      loadImage("/Demon_Boss.png"),
      loadImage("/Demon_Boss_walk.png"),
      loadImage("/Demon_Boss_run.png"),
      loadImage("/Demon_Boss_attack1.png"),
      loadImage("/Demon_Boss_attack2.png"),
      loadImage("/Demon_Boss_attack3.png"),
      loadImage("/Demon_Boss_attack4.png"),
      loadImage("/Demon_Boss_death.png"),
      loadImage("/Demon_Boss_hurt.png"),
      loadImage("/Boss_bullet.png"),
      loadImage("/box.png"),
      loadImage("/spikes.png"),
      loadImage("/favicon_1.png"),
      loadImage("/laser.png"),
      loadImage("/canon.png"),
      loadImage("/canon_bullets.png"),
      loadImage("/Chicken.png"),
      loadImage("/Golden_Key.png"),
      loadImage("/Golden_Chest.png"),
      loadImage("/Coin.png"),
      loadImage("/red/Idle.png"),
      loadImage("/red/Walk.png"),
      loadImage("/red/Hurt.png"),
      loadImage("/red/Death.png"),
      loadImage("/red/Attack.png"),
    ]);
    return { chars, player_idle, player_run, player_jump, player_hurt, player_bullet, shield, trampoline, objects, bg, bgSky, bgCityFar, bgCityNear, bgDetail, bgTrees, tiles, tile_h, boss_idle, boss_walk, boss_run, boss_attack, boss_attack2, boss_attack3, boss_attack4, boss_death, boss_hurt, boss_bullet, box, spikes, hp_frame, laser, cannon, cannon_bullets, chicken, key, chest, coin, enemy_idle, enemy_walk, enemy_hurt, enemy_death, enemy_attack };
  }
  
