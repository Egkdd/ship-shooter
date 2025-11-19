import { Application, Sprite, Assets, Graphics } from "pixi.js";

export async function createBackground(app: Application) {
  const texture = await Assets.load("../public/assets/background.jpg");
  const bg = new Sprite(texture);
  bg.width = app.screen.width;
  bg.height = app.screen.height;
  app.stage.addChildAt(bg, 0);

  const mask = new Graphics().beginFill(0xffffff).drawRect(0, 0, app.screen.width, app.screen.height).endFill();
  app.stage.mask = mask;

  return bg;
}