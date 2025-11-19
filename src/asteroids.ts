import { Sprite, Assets, Application } from "pixi.js";

export async function createAsteroids(app: Application, rocket: Sprite) {
  const texture = await Assets.load("../public/assets/asteroid (1).png");
  const asteroids: Sprite[] = [];
  const spacing = app.screen.width / 10;

  for (let i = 0; i < 10; i++) {
    const asteroid = new Sprite(texture);
    asteroid.anchor.set(0.5);
    const colX = spacing * i + spacing / 2;
    const randomOffsetX = (Math.random() - 0.5) * spacing * 0.6;
    const bands = [
      { min: 30, max: 150 },
      { min: 150, max: 300 },
      { min: 300, max: 400 },
    ];
    const maxY = Math.max(50, rocket.position.y - 140);
    const band = bands[Math.floor(Math.random() * bands.length)];
    let minY = band.min;
    let maxBandY = Math.min(band.max, maxY);
    if (maxBandY <= minY) {
      maxBandY = Math.max(minY + 20, maxY);
      minY = Math.max(30, maxBandY - 120);
    }
    asteroid.position.set(colX + randomOffsetX, Math.random() * (maxBandY - minY) + minY);
    asteroid.scale.set(Math.random() * 0.5 + 0.5);
    app.stage.addChild(asteroid);
    asteroids.push(asteroid);
  }

  return asteroids;
}
