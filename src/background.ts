import { Application, Sprite, Assets, Graphics } from "pixi.js";

export async function createBackground(app: Application) {
  // Завантажуємо текстуру фону
  await Assets.load("/assets/background.jpg");
  const texture = Assets.get("/assets/background.jpg");
  if (!texture) throw new Error("Background texture not found");

  // Створюємо спрайт фону і підганяємо під розміри екрану
  const bg = new Sprite(texture);
  bg.width = app.screen.width;
  bg.height = app.screen.height;
  app.stage.addChildAt(bg, 0);

  // Створюємо маску для фону (при необхідності обмежити видимість)
  const mask = new Graphics()
    .beginFill(0xffffff)
    .drawRect(0, 0, app.screen.width, app.screen.height)
    .endFill();
  bg.mask = mask;
  app.stage.addChild(mask);

  return bg;
}
