import { Application } from "pixi.js";

export async function createApp(width = 1280, height = 720) {
  const app = new Application();
  await app.init({ width, height });
  document.getElementById("pixi-container")!.appendChild(app.canvas);
  return app;
}
