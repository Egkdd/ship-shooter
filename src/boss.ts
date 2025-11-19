import { Sprite, Assets, Texture } from "pixi.js";

export interface Boss extends Sprite {
  vx: number;
  hp: number;
  moving: boolean;
  moveTimer: number;
  pauseTimer: number;
  shootTimer: number;
}

const BOSS_PATH = "/assets/boss.png"; // підлаштуй під свій шлях

export async function createBoss(): Promise<Boss> {
  await Assets.load(BOSS_PATH);
  const tex = Assets.get(BOSS_PATH) as Texture | undefined;
  if (!tex) throw new Error(`Boss texture not found at ${BOSS_PATH}`);

  const boss = new Sprite(tex) as Boss;
  boss.anchor.set(0.5, 0);
  boss.position.set(200, 8);
  boss.scale.set(0.5);
  boss.vx = 2;
  boss.hp = 4; // 4 хіт-поінти
  boss.moving = true;
  boss.moveTimer = 1000 + Math.random() * 2000;
  boss.pauseTimer = 500 + Math.random() * 1500;
  boss.shootTimer = 2000; // постріл кожні 2 сек

  return boss;
}

export function updateBoss(boss: Boss, deltaNormalized: number, appWidth: number) {
  const milliPerFrameApprox = 16 * deltaNormalized;

  if (boss.moving) {
    boss.x += boss.vx * deltaNormalized;
    boss.moveTimer -= milliPerFrameApprox;
    if (boss.moveTimer <= 0) {
      boss.moving = false;
      boss.pauseTimer = 400 + Math.random() * 1600;
    }
  } else {
    boss.pauseTimer -= milliPerFrameApprox;
    if (boss.pauseTimer <= 0) {
      boss.moving = true;
      boss.moveTimer = 800 + Math.random() * 2200;
      if (Math.random() < 0.5) boss.vx *= -1;
    }
  }

  const margin = Math.max(50, boss.width / 2);
  if (boss.x < margin) {
    boss.x = margin;
    boss.vx = Math.abs(boss.vx);
    boss.moving = true;
    boss.moveTimer = 600 + Math.random() * 1200;
  } else if (boss.x > appWidth - margin) {
    boss.x = appWidth - margin;
    boss.vx = -Math.abs(boss.vx);
    boss.moving = true;
    boss.moveTimer = 600 + Math.random() * 1200;
  }
}

export function bossIsDead(boss: Boss): boolean {
  return boss.hp <= 0;
}
