import { Sprite, Assets, Application } from "pixi.js";

export async function createAsteroids(app: Application, rocket: Sprite) {
  const texture = await Assets.load("../public/assets/asteroid.png");
  const asteroids: Sprite[] = [];

  const horizontalMargin = 50;
  const columns = 10;
  const spacing = (app.screen.width - 2 * horizontalMargin) / columns;

  for (let i = 0; i < columns; i++) {
    const asteroid = new Sprite(texture);
    asteroid.anchor.set(0.5);

    // Координата X з невеликим випадковим зміщенням
    const colX = horizontalMargin + spacing * i + spacing / 2;
    const randomOffsetX = (Math.random() - 0.5) * spacing * 0.4;
    const posX = colX + randomOffsetX;

    // Координата Y в межах певних смуг
    const bands = [
      { min: 30, max: 150 },
      { min: 150, max: 300 },
      { min: 300, max: Math.max(50, rocket.position.y - 140) },
    ];
    const band = bands[Math.floor(Math.random() * bands.length)];
    const minY = band.min;
    const maxY = Math.min(
      band.max,
      Math.max(band.min + 20, rocket.position.y - 140)
    );
    const posY = Math.random() * (maxY - minY) + minY;

    asteroid.position.set(posX, posY);

    // Випадковий масштаб
    asteroid.scale.set(Math.random() * 0.5 + 0.5);

    app.stage.addChild(asteroid);
    asteroids.push(asteroid);
  }

  return asteroids;
}
