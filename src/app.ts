import { Application } from "pixi.js";

export async function createApp(width = 1280, height = 720) {
  const app = new Application();
  await app.init({ width, height });

  const container = document.getElementById("pixi-container");
  if (!container)
    throw new Error("Container with id 'pixi-container' not found");

  container.appendChild(app.canvas);
  return app;
}
