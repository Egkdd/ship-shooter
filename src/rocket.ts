import { Sprite, Assets, Application, Texture } from "pixi.js";

export async function createRocket(app: Application): Promise<Sprite> {
  const ASSET_PATH = "/assets/rocket.png";

  // Завантажуємо текстуру
  await Assets.load(ASSET_PATH);

  // Дістаємо текстуру після завантаження
  const texture = Assets.get(ASSET_PATH) as Texture | undefined;
  if (!texture) {
    throw new Error(`Rocket texture not found at ${ASSET_PATH}`);
  }

  const rocket = new Sprite(texture);
  rocket.anchor.set(0.5); // центр по X та Y
  rocket.position.set(app.screen.width / 2, app.screen.height - 100); // стартова позиція

  app.stage.addChild(rocket);
  return rocket;
}
