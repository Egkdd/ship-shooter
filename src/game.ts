import { Application, Sprite, Graphics, Text, Ticker } from "pixi.js";
import type { UI } from "./ui";
import { createBoss, updateBoss, bossIsDead, Boss } from "./boss";

let currentLevel = 1;
let boss: Boss | null = null;
let level2Started = false;

function createExplosion(
  app: Application,
  explosions: { gfx: Graphics; life: number; maxLife: number }[],
  x: number,
  y: number,
  baseSize = 15
) {
  const g = new Graphics();

  // Малювання вибуху у вигляді зірки з гострими кутами
  const drawStar = (outer: number, inner: number) => {
    const points: number[] = [];
    const spikes = 6;
    const step = Math.PI / spikes;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const angle = i * step - Math.PI / 2;
      points.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    return points;
  };

  const colors = [0xff0000, 0xff6600, 0xffff00, 0xffffff];
  const outerSizes = [baseSize, baseSize * 0.7, baseSize * 0.5, baseSize * 0.3];
  const innerSizes = outerSizes.map((s) => s * 0.5);

  for (let i = 0; i < colors.length; i++) {
    g.beginFill(colors[i]);
    g.drawPolygon(drawStar(outerSizes[i], innerSizes[i]));
    g.endFill();
  }

  g.position.set(x, y);
  app.stage.addChild(g);

  explosions.push({
    gfx: g,
    life: 300 + Math.random() * 100,
    maxLife: 300 + Math.random() * 100,
  });
}

// Функція перевірки колізії
function checkCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy) < r1 + r2;
}

// Старт гри
export function startGame(
  app: Application,
  rocket: Sprite,
  asteroids: Sprite[],
  ui: UI,
  initialAmmo = 10
) {
  const keys: { [key: string]: boolean } = {};
  const bullets: Graphics[] = [];
  const bossBullets: Graphics[] = [];
  const explosions: { gfx: Graphics; life: number; maxLife: number }[] = [];
  const bulletSpeed = 10;
  const bulletRadius = 15;
  const bossBulletSpeed = 6;
  const bossBulletRadius = 12;
  let canShoot = true;
  let ammo = initialAmmo;
  let gameOver = false;
  let timeLeft = 60;

  // UI для повідомлень
  const winText = new Text("YOU WIN!", {
    fontSize: 64,
    fill: 0x00ff00,
    fontWeight: "bold",
    stroke: 0x000000,
    dropShadow: {
      color: 0x000000,
      alpha: 1,
      blur: 4,
      angle: Math.PI / 6,
      distance: 6,
    },
  });
  winText.anchor.set(0.5);
  winText.position.set(app.screen.width / 2, app.screen.height / 2 - 20);
  winText.visible = false;
  app.stage.addChild(winText);

  const loseText = new Text("YOU LOSE", {
    fontSize: 64,
    fill: 0xff0000,
    fontWeight: "bold",
    stroke: 0x000000,
    dropShadow: {
      color: 0x000000,
      alpha: 1,
      blur: 4,
      angle: Math.PI / 6,
      distance: 6,
    },
  });
  loseText.anchor.set(0.5);
  loseText.position.set(app.screen.width / 2, app.screen.height / 2 - 20);
  loseText.visible = false;
  app.stage.addChild(loseText);

  // HP-бар боса
  const bossHPBar = new Graphics();
  app.stage.addChild(bossHPBar);

  // Початкові значення UI
  ui.bulletText.text = `Bullets: ${ammo}`;
  ui.asteroidText.text = `Asteroids: ${asteroids.length}`;
  ui.timerText.text = formatTime(timeLeft);

  // Керування
  function onKeyDown(e: KeyboardEvent) {
    keys[e.key] = true;
    if (e.code === "Space" && canShoot && ammo > 0 && !gameOver) {
      createBullet();
      ammo--;
      ui.bulletText.text = `Bullets: ${ammo}`;
      canShoot = false;
      setTimeout(() => (canShoot = true), 100);
    }
  }
  function onKeyUp(e: KeyboardEvent) {
    keys[e.key] = false;
  }
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  // Створення кулі гравця
  function createBullet() {
    const bullet = new Graphics();
    const sides = 6; // кількість променів
    const rOuter = bulletRadius; // зовнішній радіус
    const rInner = rOuter * 0.5; // внутрішній радіус
    const points: number[] = [];

    for (let i = 0; i < sides * 2; i++) {
      const r = i % 2 === 0 ? rOuter : rInner;
      const angle = (i / (sides * 2)) * Math.PI * 2 - Math.PI / 2;
      points.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }

    // Градієнт кольору
    bullet.lineStyle(1, 0xff6600);
    bullet.beginFill(0xffff00);
    bullet.drawPolygon(points);
    bullet.endFill();

    bullet.position.set(rocket.x, rocket.y - 80);
    app.stage.addChild(bullet);
    bullets.push(bullet);
  }

  // Створення кулі боса
  function createBossBullet() {
    if (!boss) return;
    const bullet = new Graphics();
    const radius = bossBulletRadius * 1.5;

    bullet.lineStyle(3, 0xffffff);
    const colors = [0x800080, 0xff0000];
    const scales = [1, 0.6];
    for (let i = 0; i < colors.length; i++) {
      bullet.beginFill(colors[i]);
      bullet.drawCircle(0, 0, radius * scales[i]);
      bullet.endFill();
    }
    bullet.position.set(boss.x, boss.y + boss.height);
    app.stage.addChild(bullet);
    bossBullets.push(bullet);
  }

  // Таймер гри
  const timerInterval = setInterval(() => {
    if (!gameOver && timeLeft > 0) {
      timeLeft--;
      ui.timerText.text = formatTime(timeLeft);
    } else if (!gameOver && timeLeft <= 0) {
      loseText.visible = true;
      gameOver = true;
      ui.createEndButton("TRY AGAIN", () => location.reload());
      cleanup();
    }
  }, 1000);

  // Рівень 2 (з Босом)
  async function startLevel2() {
    if (level2Started) return;
    level2Started = true;
    currentLevel = 2;
    ammo = 10;
    timeLeft = 60;
    ui.bulletText.text = `Bullets: ${ammo}`;
    ui.timerText.text = formatTime(timeLeft);

    // Видаляємо астероїди
    for (const a of asteroids) app.stage.removeChild(a);
    asteroids.length = 0;

    boss = await createBoss();
    boss.x = app.screen.width / 2;
    boss.y = 8;
    boss.shootTimer = 2000; // 2 секунди між пострілами
    app.stage.addChild(boss);

    const levelText = new Text("LEVEL 2", { fill: 0xffffff, fontSize: 50 });
    levelText.anchor.set(0.5);
    levelText.position.set(app.screen.width / 2, app.screen.height / 2);
    app.stage.addChild(levelText);
    setTimeout(() => app.stage.removeChild(levelText), 2000);
  }

  // Головний ігровий цикл
  app.ticker.add((ticker: Ticker) => {
    const delta = ticker.deltaMS / (1000 / 60);
    if (gameOver) return;

    // Рух ракети
    const rocketSpeed = 7;
    if (keys["ArrowLeft"] || keys["a"])
      rocket.x = Math.max(rocket.width / 2, rocket.x - rocketSpeed * delta);
    if (keys["ArrowRight"] || keys["d"])
      rocket.x = Math.min(
        app.screen.width - rocket.width / 2,
        rocket.x + rocketSpeed * delta
      );

    //  Рух куль гравця
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.position.y -= bulletSpeed * delta;

      // Колізії з астероїдами
      if (currentLevel === 1) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
          const a = asteroids[j];
          const asteroidRadius = Math.max(a.width, a.height) * 0.2;
          if (
            checkCollision(b.x, b.y, bulletRadius, a.x, a.y, asteroidRadius)
          ) {
            createExplosion(
              app,
              explosions,
              a.x,
              a.y,
              Math.max(a.width, a.height) * 0.8
            );
            app.stage.removeChild(a);
            asteroids.splice(j, 1);
            app.stage.removeChild(b);
            bullets.splice(i, 1);
            ui.asteroidText.text = `Asteroids: ${asteroids.length}`;
            break;
          }
        }
      }

      // Колізії з босом
      if (currentLevel === 2 && boss) {
        const bossRadius = Math.max(boss.width, boss.height) / 2;
        if (
          checkCollision(
            b.x,
            b.y,
            bulletRadius,
            boss.x,
            boss.y + boss.height / 2,
            bossRadius
          )
        ) {
          boss.hp -= 1;
          createExplosion(app, explosions, b.x, b.y, 20);
          app.stage.removeChild(b);
          bullets.splice(i, 1);
          continue;
        }
      }

      if (b.position.y < -50) {
        app.stage.removeChild(b);
        bullets.splice(i, 1);
      }
    }

    ui.bulletText.text = `Bullets: ${ammo}`;

    // Логіка боса
    if (currentLevel === 2 && boss) {
      updateBoss(boss, delta, app.screen.width);

      // Стрільба боса кожні 2 секунди
      boss.shootTimer -= ticker.deltaMS;
      if (boss.shootTimer <= 0) {
        createBossBullet();
        boss.shootTimer = 2000;
      }

      // Рух куль боса та колізії
      for (let i = bossBullets.length - 1; i >= 0; i--) {
        const b = bossBullets[i];
        b.position.y += bossBulletSpeed * delta;

        // Куля боса в гравця
        if (
          checkCollision(
            b.x,
            b.y,
            bossBulletRadius,
            rocket.x,
            rocket.y,
            Math.max(rocket.width, rocket.height) / 2
          )
        ) {
          app.stage.removeChild(b);
          bossBullets.splice(i, 1);
          loseText.visible = true;
          gameOver = true;
          ui.createEndButton("TRY AGAIN", () => location.reload());
          continue;
        }

        // Куля боса проти кулі гравця
        for (let j = bullets.length - 1; j >= 0; j--) {
          const playerB = bullets[j];
          if (
            checkCollision(
              b.x,
              b.y,
              bossBulletRadius,
              playerB.x,
              playerB.y,
              bulletRadius
            )
          ) {
            app.stage.removeChild(b);
            app.stage.removeChild(playerB);
            bossBullets.splice(i, 1);
            bullets.splice(j, 1);
            break;
          }
        }

        if (b.position.y > app.screen.height + 50) {
          app.stage.removeChild(b);
          bossBullets.splice(i, 1);
        }
      }

      // HP-бар боса
      bossHPBar.clear();
      bossHPBar.beginFill(0xff0000);
      const barWidth = 80;
      const barHeight = 20;
      bossHPBar.drawRect(
        boss.x - barWidth / 2,
        boss.y - 15,
        (boss.hp / 4) * barWidth,
        barHeight
      );
      bossHPBar.endFill();
    }

    // Перевірка виграшу / програшу
    if (currentLevel === 1 && asteroids.length === 0) {
      startLevel2();
    } else if (currentLevel === 2 && boss && bossIsDead(boss)) {
      // Створюємо вибух боса
      const explosionSize = Math.max(boss.width, boss.height) * 0.7;
      createExplosion(
        app,
        explosions,
        boss.x,
        boss.y + boss.height / 2,
        explosionSize
      );

      app.stage.removeChild(boss);
      boss = null;

      const waitExplosion = setInterval(() => {
        if (explosions.length === 0) {
          clearInterval(waitExplosion);
          winText.visible = true;
          gameOver = true;
          ui.createEndButton("RESTART", () => location.reload());
        }
      }, 50);
    } else if (
      ammo === 0 &&
      bullets.length === 0 &&
      ((currentLevel === 1 && asteroids.length > 0) ||
        (currentLevel === 2 && boss && !bossIsDead(boss)))
    ) {
      loseText.visible = true;
      gameOver = true;
      ui.createEndButton("TRY AGAIN", () => location.reload());
    }

    // Анімація вибухів
    for (let k = explosions.length - 1; k >= 0; k--) {
      const ex = explosions[k];
      ex.life -= 16 * delta;
      const progress = 1 - Math.max(0, ex.life) / ex.maxLife;
      const scale = progress * 1.2;
      ex.gfx.scale.set(scale);
      ex.gfx.alpha = 1 - progress;
      if (ex.life <= 0) {
        app.stage.removeChild(ex.gfx);
        explosions.splice(k, 1);
      }
    }
  });

  // Прибирання
  function cleanup() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    clearInterval(timerInterval);
  }

  // Форматування таймера
  function formatTime(sec: number) {
    const minutes = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (sec % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }
}
