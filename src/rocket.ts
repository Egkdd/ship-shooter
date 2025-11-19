import { Sprite, Assets, Application } from "pixi.js";

export async function createRocket(app: Application) {
  const texture = await Assets.load("../public/assets/rocket (1).png");
  const rocket = new Sprite(texture);
  rocket.anchor.set(0.5);
  rocket.position.set(app.screen.width / 2, app.screen.height - 100);
  app.stage.addChild(rocket);
  return rocket;
}
