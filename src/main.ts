import {
  Application,
  Assets,
  Sprite,
  Graphics,
  Text,
  Container,
} from "pixi.js";

(async () => {
  // --- Create Application ---
  const app = new Application(); // без параметрів
  await app.init({ width: 1280, height: 720 }); // ініціалізація через init
  document.getElementById("pixi-container")!.appendChild(app.canvas); // замість app.view

  // --- Background ---
  const backgroundTexture = await Assets.load("/assets/background.jpg");
  const background = new Sprite(backgroundTexture);
  background.width = app.screen.width;
  background.height = app.screen.height;
  app.stage.addChildAt(background, 0);

  // --- Mask ---
  app.stage.mask = new Graphics().beginFill(0xffffff).drawRect(0, 0, 1280, 720).endFill();

  // --- Rocket ---
  const rocketTexture = await Assets.load("/assets/rocket (1).png");
  const rocket = new Sprite(rocketTexture);
  rocket.anchor.set(0.5);
  rocket.position.set(app.screen.width / 2, app.screen.height - 100);
  app.stage.addChild(rocket);

  // --- Asteroids ---
  const asteroidTexture = await Assets.load("/assets/asteroid (1).png");
  const asteroids: Sprite[] = [];
  const asteroidSpacing = app.screen.width / 10;
  for (let i = 0; i < 10; i++) {
    const asteroid = new Sprite(asteroidTexture);
    asteroid.anchor.set(0.5);
    const columnX = asteroidSpacing * i + asteroidSpacing / 2;
    const randomOffsetX = (Math.random() - 0.5) * (asteroidSpacing * 0.6);
    const bands = [
      { min: 30, max: 150 },
      { min: 150, max: 300 },
      { min: 300, max: 400 },
    ];
    const maxAllowedY = Math.max(50, rocket.position.y - 140);
    const band = bands[Math.floor(Math.random() * bands.length)];
    let bandMin = band.min;
    let bandMax = Math.min(band.max, maxAllowedY);
    if (bandMax <= bandMin) {
      bandMax = Math.max(bandMin + 20, maxAllowedY);
      bandMin = Math.max(30, bandMax - 120);
    }
    const randomY = Math.random() * (bandMax - bandMin) + bandMin;
    asteroid.position.set(columnX + randomOffsetX, randomY);
    asteroid.scale.set(Math.random() * 0.5 + 0.5);
    app.stage.addChild(asteroid);
    asteroids.push(asteroid);
  }

  // --- Input ---
  const keys: { [key: string]: boolean } = {};
  window.addEventListener("keydown", (e) => (keys[e.key] = true));
  window.addEventListener("keyup", (e) => (keys[e.key] = false));

  const rocketSpeed = 7;
  const bullets: Graphics[] = [];
  const bulletSpeed = 10;
  const bulletRadius = 15;
  let canShoot = true;
  const shootCooldown = 100;
  let ammo = 10;

  // --- UI Text ---
  const bulletCountText = new Text(`Bullets: ${ammo}`, { fontSize: 24, fill: 0xffffff, fontWeight: "bold" });
  bulletCountText.position.set(10, 10);
  app.stage.addChild(bulletCountText);

  const asteroidCountText = new Text(`Asteroids: ${asteroids.length}`, { fontSize: 24, fill: 0xffffff, fontWeight: "bold" });
  asteroidCountText.position.set(10, 40);
  app.stage.addChild(asteroidCountText);

  let timeLeft = 60;
  const timerText = new Text("01:00", { fontSize: 24, fill: 0xffffff, fontWeight: "bold" });
  timerText.position.set(app.screen.width - 100, 10);
  app.stage.addChild(timerText);

  let gameStarted = false;
  let gameOver = false;

  // --- Win / Lose Texts ---
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

  // --- Button Factory ---
  function createButton(label: string, x: number, y: number, onClick: () => void) {
    const container = new Container();
    container.position.set(x, y);
    container.interactive = true;
    container.cursor = "pointer";

    const bg = new Graphics();
    const width = 250;
    const height = 70;
    const radius = 15;
    const color = 0x387478;
    bg.beginFill(color);
    bg.drawRoundedRect(-width / 2, -height / 2, width, height, radius);
    bg.endFill();
    container.addChild(bg);

    const text = new Text(label, { fontSize: 36, fill: 0xffffff, fontWeight: "bold" });
    text.anchor.set(0.5);
    container.addChild(text);

    container.on("pointerover", () => { bg.tint = 0x629584; });
    container.on("pointerout", () => { bg.tint = 0xffffff; container.scale.set(1); });
    container.on("pointerdown", () => { container.scale.set(0.95); setTimeout(() => container.scale.set(1), 100); onClick(); });

    app.stage.addChild(container);
    return container;
  }

  // --- Start Button ---
  const startButton = createButton("START", app.screen.width / 2, app.screen.height / 2, () => {
    startButton.visible = false;
    gameStarted = true;
  });

  // --- Timer ---
  const timerInterval = setInterval(() => {
    if (gameStarted && !gameOver && timeLeft > 0) {
      timeLeft--;
      const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
      const seconds = (timeLeft % 60).toString().padStart(2, "0");
      timerText.text = `${minutes}:${seconds}`;
    } else if (timeLeft <= 0 && !gameOver) {
      loseText.visible = true;
      gameOver = true;
    }
  }, 1000);

  // --- Bullet Creation ---
  function createBullet() {
    const bullet = new Graphics();
    const points = 6;
    const outerRadius = bulletRadius;
    const innerRadius = bulletRadius * 0.5;
    const points_array: number[] = [];
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      points_array.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    bullet.poly(points_array).fill({ color: 0xffff00 }).stroke({ color: 0xff0000, width: 2 });
    bullet.position.set(rocket.position.x, rocket.position.y - 80);
    app.stage.addChild(bullet);
    bullets.push(bullet);
  }

  function createBoomEffect(x: number, y: number) {
    const boom = new Graphics();
    const points = 8;
    function createStarPoints(radius: number, innerR: number) {
      const arr: number[] = [];
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? radius : radius * innerR;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        arr.push(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      return arr;
    }
    boom.poly(createStarPoints(75, 0.4)).stroke({ color: 0xff0000, width: 4 });
    boom.poly(createStarPoints(60, 0.4)).stroke({ color: 0xffaa00, width: 4 });
    boom.poly(createStarPoints(45, 0.4)).stroke({ color: 0xffff00, width: 4 });
    boom.poly(createStarPoints(30, 0.4)).fill({ color: 0xffffff });
    boom.position.set(x, y);
    app.stage.addChild(boom);
    setTimeout(() => app.stage.removeChild(boom), 200);
  }

  function checkCollision(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy) < r1 + r2;
  }

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && canShoot && ammo > 0 && !gameOver && gameStarted) {
      createBullet();
      ammo--;
      bulletCountText.text = `Bullets: ${ammo}`;
      canShoot = false;
      setTimeout(() => (canShoot = true), shootCooldown);
    }
  });

  function createEndButton(label: string, onClick: () => void) {
    createButton(label, app.screen.width / 2, app.screen.height / 2 + 80, onClick);
  }

  // --- Game Loop ---
  app.ticker.add(() => {
    if (!gameStarted || gameOver) return;

    if (keys["ArrowLeft"] || keys["a"]) rocket.position.x = Math.max(rocket.width / 2, rocket.position.x - rocketSpeed);
    if (keys["ArrowRight"] || keys["d"]) rocket.position.x = Math.min(app.screen.width - rocket.width / 2, rocket.position.x + rocketSpeed);

    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].position.y -= bulletSpeed;
      for (let j = asteroids.length - 1; j >= 0; j--) {
        if (checkCollision(bullets[i].position.x, bullets[i].position.y, bulletRadius,
          asteroids[j].position.x, asteroids[j].position.y, Math.max(asteroids[j].width, asteroids[j].height) * 0.2)) {
          createBoomEffect(asteroids[j].position.x, asteroids[j].position.y);
          app.stage.removeChild(asteroids[j]);
          asteroids.splice(j, 1);
          app.stage.removeChild(bullets[i]);
          bullets.splice(i, 1);
          break;
        }
      }
      if (i >= 0 && bullets[i] && bullets[i].position.y < 0) {
        app.stage.removeChild(bullets[i]);
        bullets.splice(i, 1);
      }
    }

    if (!gameOver) {
      if (asteroids.length === 0) {
        winText.visible = true;
        gameOver = true;
        createEndButton("NEXT LEVEL", () => location.reload());
      } else if (ammo === 0 && bullets.length === 0 && asteroids.length > 0) {
        loseText.visible = true;
        gameOver = true;
        createEndButton("TRY AGAIN", () => location.reload());
      }
    }

    bulletCountText.text = `Bullets: ${ammo}`;
    asteroidCountText.text = `Asteroids: ${asteroids.length}`;
  });
})();
