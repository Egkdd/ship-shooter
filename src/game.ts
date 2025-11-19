import { Application, Sprite, Graphics, Text, Ticker } from "pixi.js";
import type { UI } from "./ui";
import { createBoss, updateBoss, bossIsDead, Boss } from "./boss";

let currentLevel = 1;
let boss: Boss | null = null;
let level2Started = false;

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

  // --- UI ---
  const winText = new Text("YOU WIN", { fontSize: 64, fill: 0x00ff00, fontWeight: "bold" });
  winText.anchor.set(0.5);
  winText.position.set(app.screen.width / 2, app.screen.height / 2 - 20);
  winText.visible = false;
  app.stage.addChild(winText);

  const loseText = new Text("YOU LOSE", { fontSize: 64, fill: 0xff0000, fontWeight: "bold" });
  loseText.anchor.set(0.5);
  loseText.position.set(app.screen.width / 2, app.screen.height / 2 - 20);
  loseText.visible = false;
  app.stage.addChild(loseText);

  // HP-бар боса
  const bossHPBar = new Graphics();
  app.stage.addChild(bossHPBar);

  ui.bulletText.text = `Bullets: ${ammo}`;
  ui.asteroidText.text = `Asteroids: ${asteroids.length}`;
  ui.timerText.text = formatTime(timeLeft);

  // --- Input ---
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
  function onKeyUp(e: KeyboardEvent) { keys[e.key] = false; }
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  // --- Bullet ---
  function createBullet() {
    const bullet = new Graphics();
    const sides = 6;
    const rOuter = bulletRadius;
    const points: number[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      points.push(Math.cos(angle) * rOuter, Math.sin(angle) * rOuter);
    }
    bullet.lineStyle(2, 0xff0000);
    bullet.beginFill(0xffff00);
    bullet.drawPolygon(points);
    bullet.endFill();
    bullet.position.set(rocket.x, rocket.y - 80);
    app.stage.addChild(bullet);
    bullets.push(bullet);
  }

  // --- Boss Bullet ---
  function createBossBullet() {
    if (!boss) return;
    const bullet = new Graphics();
    bullet.beginFill(0xff00ff);
    bullet.drawCircle(0, 0, bossBulletRadius);
    bullet.endFill();
    bullet.position.set(boss.x, boss.y + boss.height);
    app.stage.addChild(bullet);
    bossBullets.push(bullet);
  }

  // --- Explosion ---
  function createExplosion(x: number, y: number, baseSize = 30) {
    const g = new Graphics();
    g.beginFill(0xffcc33);
    g.drawCircle(0, 0, baseSize * 0.4);
    g.endFill();
    g.lineStyle(2, 0xff6600);
    g.drawCircle(0, 0, baseSize * 0.6);
    g.position.set(x, y);
    app.stage.addChild(g);
    explosions.push({ gfx: g, life: 400 + Math.random() * 200, maxLife: 400 + Math.random() * 200 });
  }

  function checkCollision(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy) < r1 + r2;
  }

  // --- Timer ---
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

  // --- Level 2 ---
  async function startLevel2() {
    if (level2Started) return;
    level2Started = true;
    currentLevel = 2;
    ammo = 10;
    timeLeft = 60;
    ui.bulletText.text = `Bullets: ${ammo}`;
    ui.timerText.text = formatTime(timeLeft);

    for (const a of asteroids) app.stage.removeChild(a);
    asteroids.length = 0;

    boss = await createBoss();
    boss.x = app.screen.width / 2;
    boss.y = 8;
    app.stage.addChild(boss);

    const levelText = new Text("LEVEL 2", { fill: 0xffffff, fontSize: 50 });
    levelText.anchor.set(0.5);
    levelText.position.set(app.screen.width / 2, app.screen.height / 2);
    app.stage.addChild(levelText);
    setTimeout(() => app.stage.removeChild(levelText), 2000);
  }

  // --- Game Loop ---
  app.ticker.add((ticker: Ticker) => {
    const delta = ticker.deltaMS / (1000 / 60);
    if (gameOver) return;

    // Рух ракети
    const rocketSpeed = 7;
    if (keys["ArrowLeft"] || keys["a"]) rocket.x = Math.max(rocket.width / 2, rocket.x - rocketSpeed * delta);
    if (keys["ArrowRight"] || keys["d"]) rocket.x = Math.min(app.screen.width - rocket.width / 2, rocket.x + rocketSpeed * delta);

    // Рух куль гравця
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.position.y -= bulletSpeed * delta;

      if (currentLevel === 1) {
        for (let j = asteroids.length - 1; j >= 0; j--) {
          const a = asteroids[j];
          const asteroidRadius = Math.max(a.width, a.height) * 0.2;
          if (checkCollision(b.x, b.y, bulletRadius, a.x, a.y, asteroidRadius)) {
            createExplosion(a.x, a.y, Math.max(a.width, a.height) * 0.8);
            app.stage.removeChild(a);
            asteroids.splice(j, 1);
            app.stage.removeChild(b);
            bullets.splice(i, 1);
            ui.asteroidText.text = `Asteroids: ${asteroids.length}`;
            break;
          }
        }
      }

      if (currentLevel === 2 && boss) {
        const bossRadius = Math.max(boss.width, boss.height) / 2;
        if (checkCollision(b.x, b.y, bulletRadius, boss.x, boss.y + boss.height / 2, bossRadius)) {
          boss.hp -= 1;
          createExplosion(b.x, b.y, 20);
          app.stage.removeChild(b);
          bullets.splice(i, 1);
          continue;
        }
      }

      if (b.position.y < -50) { app.stage.removeChild(b); bullets.splice(i, 1); }
    }

    ui.bulletText.text = `Bullets: ${ammo}`;

    // --- Boss Logic ---
    if (currentLevel === 2 && boss) {
      updateBoss(boss, delta, app.screen.width);

      // Стрільба боса
      boss.shootTimer -= ticker.deltaMS;
      if (boss.shootTimer <= 0) {
        createBossBullet();
        boss.shootTimer = 2000;
      }

      // Рух куль боса
      for (let i = bossBullets.length - 1; i >= 0; i--) {
        const b = bossBullets[i];
        b.position.y += bossBulletSpeed * delta;

        // Взаємодія з гравцем
        if (checkCollision(b.x, b.y, bossBulletRadius, rocket.x, rocket.y, Math.max(rocket.width, rocket.height)/2)) {
          app.stage.removeChild(b);
          bossBullets.splice(i, 1);
          loseText.visible = true;
          gameOver = true;
          ui.createEndButton("TRY AGAIN", () => location.reload());
        }

        // Взаємодія з кулями гравця
        for (let j = bullets.length - 1; j >= 0; j--) {
          const playerB = bullets[j];
          if (checkCollision(b.x, b.y, bossBulletRadius, playerB.x, playerB.y, bulletRadius)) {
            app.stage.removeChild(b);
            app.stage.removeChild(playerB);
            bossBullets.splice(i, 1);
            bullets.splice(j, 1);
            break;
          }
        }

        if (b.position.y > app.screen.height + 50) { app.stage.removeChild(b); bossBullets.splice(i, 1); }
      }

      // --- HP-bar ---
      bossHPBar.clear();
      bossHPBar.beginFill(0xff0000);
      const barWidth = 80;
      const barHeight = 10;
      bossHPBar.drawRect(boss.x - barWidth/2, boss.y - 15, (boss.hp/4) * barWidth, barHeight);
      bossHPBar.endFill();
    }

    // --- Check win/lose ---
    if (currentLevel === 1 && asteroids.length === 0) startLevel2();
    else if (currentLevel === 2 && boss && bossIsDead(boss)) {
      createExplosion(boss.x, boss.y + boss.height/2, Math.max(boss.width, boss.height));
      winText.visible = true;
      gameOver = true;
      ui.createEndButton("TRY AGAIN", () => location.reload());
    } else if (ammo === 0 && bullets.length === 0 && ((currentLevel===1 && asteroids.length>0) || (currentLevel===2 && boss && !bossIsDead(boss)))) {
      loseText.visible = true;
      gameOver = true;
      ui.createEndButton("TRY AGAIN", () => location.reload());
    }

    // --- Explosions ---
    for (let k = explosions.length-1; k>=0; k--) {
      const ex = explosions[k];
      ex.life -= 16*delta;
      const progress = 1 - Math.max(0, ex.life)/ex.maxLife;
      const scale = 1 + progress*1.2;
      ex.gfx.scale.set(scale);
      ex.gfx.alpha = 1-progress;
      if(ex.life<=0){ app.stage.removeChild(ex.gfx); explosions.splice(k,1);}
    }
  });

  function cleanup() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    clearInterval(timerInterval);
  }

  function formatTime(sec:number) {
    const minutes = Math.floor(sec/60).toString().padStart(2,'0');
    const seconds = (sec%60).toString().padStart(2,'0');
    return `${minutes}:${seconds}`;
  }
}
