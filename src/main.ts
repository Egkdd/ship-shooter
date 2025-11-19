import { createApp } from "./app";
import { createBackground } from "./background";
import { createRocket } from "./rocket";
import { createAsteroids } from "./asteroids";
import { setupUI, UI } from "./ui";
import { startGame } from "./game";

(async () => {
  const app = await createApp();
  await createBackground(app);

  const rocket = await createRocket(app);
  const asteroids = await createAsteroids(app, rocket);

  let ui: UI;
  ui = setupUI(app, 10, asteroids.length, () => {
    if (ui.startButton) ui.startButton.visible = false;
    startGame(app, rocket, asteroids, ui);
  });
})();
