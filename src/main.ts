import {
  Application,
  Assets,
  Sprite,
  Graphics,
  Text,
  TextStyle,
} from "pixi.js";

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ width: 1280, height: 720 });

  // Append the application canvas to the document body
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // Load background image
  const backgroundTexture = await Assets.load("/assets/background.jpg");
  const background = new Sprite(backgroundTexture);
  background.width = app.screen.width;
  background.height = app.screen.height;
  app.stage.addChildAt(background, 0);

  // Enable clipping to prevent objects from showing outside canvas bounds
  app.stage.mask = new (await import("pixi.js")).Graphics()
    .rect(0, 0, 1280, 720)
    .fill({ color: 0xffffff });

  // Load the bunny texture
  const texture = await Assets.load("/assets/rocket (1).png");

  // Create a bunny Sprite
  const rocket = new Sprite(texture);

  // Center the sprite's anchor point
  rocket.anchor.set(0.5);

  // Move the sprite to the center of the screen
  rocket.position.set(app.screen.width / 2, app.screen.height - 100);

  // Add the bunny to the stage
  app.stage.addChild(rocket);

  // Load asteroid texture
  const asteroidTexture = await Assets.load("/assets/asteroid (1).png");

  // Create 10 asteroids in random positions without overlap
  const asteroids: Sprite[] = [];
  const asteroidSpacing = app.screen.width / 10; // Divide screen into 10 sections

  for (let i = 0; i < 10; i++) {
    const asteroid = new Sprite(asteroidTexture);
    asteroid.anchor.set(0.5);

    // Position in separate column with random offset
    const columnX = asteroidSpacing * i + asteroidSpacing / 2;
    const randomOffsetX = (Math.random() - 0.5) * (asteroidSpacing * 0.6);
    // Choose Y from several vertical bands so asteroids appear at different depths
    // but ensure they never spawn at or below the rocket's nose.
    const bands = [
      { min: 30, max: 150 }, // higher
      { min: 150, max: 300 }, // mid
      { min: 300, max: 500 }, // deeper (near rocket)
    ];

    const maxAllowedY = Math.max(50, rocket.position.y - 140); // keep asteroids above this

    // Pick a band and clamp it so the asteroid Y stays above the rocket nose
    const band = bands[Math.floor(Math.random() * bands.length)];
    let bandMin = band.min;
    let bandMax = Math.min(band.max, maxAllowedY);

    // If the band becomes invalid (min >= max), fall back to a safe range above rocket
    if (bandMax <= bandMin) {
      bandMax = Math.max(bandMin + 20, maxAllowedY);
      bandMin = Math.max(30, bandMax - 120);
    }

    const randomY = Math.random() * (bandMax - bandMin) + bandMin;
    asteroid.position.set(columnX + randomOffsetX, randomY);

    // Optional: random scale for variety
    const randomScale = Math.random() * 0.5 + 0.5; // Scale between 0.5 and 1
    asteroid.scale.set(randomScale);

    app.stage.addChild(asteroid);
    asteroids.push(asteroid);
  }

  // Track keyboard input
  const keys: { [key: string]: boolean } = {};

  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
  });

  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  // Rocket movement speed
  const rocketSpeed = 7;

  // Bullets array and speed
  const bullets: Graphics[] = [];
  const bulletSpeed = 10;
  const bulletRadius = 15;
  let canShoot = true;
  const shootCooldown = 100; // milliseconds
  // Ammo (number of shoots available)
  let ammo = 10;

  // Create UI text for bullets (ammo) and asteroids count
  const bulletCountText = new Text({
    text: `Bullets: ${ammo}`,
    style: new TextStyle({
      fontSize: 24,
      fill: 0xffffff,
      fontWeight: "bold",
    }),
  });
  bulletCountText.position.set(10, 10);
  app.stage.addChild(bulletCountText);

  const asteroidCountText = new Text({
    text: `Asteroids: ${asteroids.length}`,
    style: new TextStyle({
      fontSize: 24,
      fill: 0xffffff,
      fontWeight: "bold",
    }),
  });
  asteroidCountText.position.set(10, 40);
  app.stage.addChild(asteroidCountText);

  // Game state
  let gameOver = false;

  // Win / Lose messages (centered)
  const winText = new Text(
    "YOU WIN",
    new TextStyle({ fontSize: 64, fill: 0x00ff00, fontWeight: "bold" }),
  );
  app.stage.addChild(winText);
  winText.visible = false;
  winText.pivot.set(winText.width / 2, winText.height / 2);
  winText.position.set(app.screen.width / 2, app.screen.height / 2 - 20);

  const loseText = new Text(
    "YOU LOSE",
    new TextStyle({ fontSize: 64, fill: 0xff0000, fontWeight: "bold" }),
  );
  app.stage.addChild(loseText);
  loseText.visible = false;
  loseText.pivot.set(loseText.width / 2, loseText.height / 2);
  loseText.position.set(app.screen.width / 2, app.screen.height / 2 - 20);

  // Function to create a bullet
  function createBullet() {
    const bullet = new Graphics();
    const points = 6;
    const outerRadius = bulletRadius;
    const innerRadius = bulletRadius * 0.5;

    // Draw star points
    const points_array: number[] = [];
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      points_array.push(Math.cos(angle) * radius);
      points_array.push(Math.sin(angle) * radius);
    }

    bullet
      .poly(points_array)
      .fill({ color: 0xffff00 })
      .stroke({ color: 0xff0000, width: 2 });
    bullet.position.set(rocket.position.x, rocket.position.y - 80);
    app.stage.addChild(bullet);
    bullets.push(bullet);
  }

  // Function to create boom effect
  function createBoomEffect(x: number, y: number) {
    const boom = new Graphics();
    const points = 8; // 8-pointed star

    // Function to create star points
    function createStarPoints(
      radius: number,
      innerRadiusMultiplier: number,
    ): number[] {
      const starPoints: number[] = [];
      const outerR = radius;
      const innerR = radius * innerRadiusMultiplier;
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        starPoints.push(Math.cos(angle) * r);
        starPoints.push(Math.sin(angle) * r);
      }
      return starPoints;
    }

    // Red star (outermost)
    boom.poly(createStarPoints(75, 0.4)).stroke({ color: 0xff0000, width: 4 });

    // Orange star
    boom.poly(createStarPoints(60, 0.4)).stroke({ color: 0xffaa00, width: 4 });

    // Yellow star
    boom.poly(createStarPoints(45, 0.4)).stroke({ color: 0xffff00, width: 4 });

    // White star (center)
    boom.poly(createStarPoints(30, 0.4)).fill({ color: 0xffffff });

    boom.position.set(x, y);
    app.stage.addChild(boom);

    // Remove boom effect after short time
    setTimeout(() => {
      app.stage.removeChild(boom);
    }, 200);
  }

  // Function to check collision between two circles
  function checkCollision(
    x1: number,
    y1: number,
    r1: number,
    x2: number,
    y2: number,
    r2: number,
  ): boolean {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
  }

  // Track spacebar for shooting
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && canShoot && ammo > 0 && !gameOver) {
      // Fire only if ammo available and game is not over
      createBullet();
      ammo -= 1;
      bulletCountText.text = `Bullets: ${ammo}`;
      canShoot = false;
      setTimeout(() => {
        canShoot = true;
      }, shootCooldown);
    }
  });

  // Listen for animate update
  app.ticker.add(() => {
    const rocketWidth = rocket.width;
    if (!gameOver) {
      if (keys["ArrowLeft"] || keys["a"]) {
        rocket.position.x = Math.max(
          rocketWidth / 2,
          rocket.position.x - rocketSpeed,
        );
      }
      if (keys["ArrowRight"] || keys["d"]) {
        rocket.position.x = Math.min(
          app.screen.width - rocketWidth / 2,
          rocket.position.x + rocketSpeed,
        );
      }
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].position.y -= bulletSpeed;

      // Check collision with asteroids
      for (let j = asteroids.length - 1; j >= 0; j--) {
        if (
          checkCollision(
            bullets[i].position.x,
            bullets[i].position.y,
            bulletRadius,
            asteroids[j].position.x,
            asteroids[j].position.y,
            Math.max(asteroids[j].width, asteroids[j].height) * 0.2,
          )
        ) {
          // Create boom effect
          createBoomEffect(asteroids[j].position.x, asteroids[j].position.y);

          // Remove asteroid
          app.stage.removeChild(asteroids[j]);
          asteroids.splice(j, 1);

          // Remove bullet
          app.stage.removeChild(bullets[i]);
          bullets.splice(i, 1);
          break; // Exit inner loop after collision
        }
      }

      // Remove bullets that go off screen
      if (i >= 0 && bullets[i] && bullets[i].position.y < 0) {
        app.stage.removeChild(bullets[i]);
        bullets.splice(i, 1);
      }
    }

    // Check win/lose conditions (only once when condition met)
    if (!gameOver) {
      if (asteroids.length === 0) {
        winText.visible = true;
        gameOver = true;
      } else if (ammo === 0 && bullets.length === 0 && asteroids.length > 0) {
        loseText.visible = true;
        gameOver = true;
      }
    }

    // Update UI text
    bulletCountText.text = `Bullets: ${ammo}`;
    asteroidCountText.text = `Asteroids: ${asteroids.length}`;
  });
})();
