import { Application, Text, Container, Graphics } from "pixi.js";

export interface UI {
  startButton: Container;
  bulletText: Text;
  asteroidText: Text;
  timerText: Text;
  createEndButton: (label: string, onClick: () => void) => void;
}

export function setupUI(app: Application, initialAmmo: number, asteroidCount: number, onStart: () => void): UI {
  // --- Bullet / Asteroid Texts ---
  const bulletText = new Text(`Bullets: ${initialAmmo}`, { fontSize: 24, fill: 0xffffff, fontWeight: "bold" });
  bulletText.position.set(10, 10);
  app.stage.addChild(bulletText);

  const asteroidText = new Text(`Asteroids: ${asteroidCount}`, { fontSize: 24, fill: 0xffffff, fontWeight: "bold" });
  asteroidText.position.set(10, 40);
  app.stage.addChild(asteroidText);

  const timerText = new Text("01:00", { fontSize: 24, fill: 0xffffff, fontWeight: "bold" });
  timerText.position.set(app.screen.width - 100, 10);
  app.stage.addChild(timerText);

  // --- Button Factory ---
  function createButton(label: string, x: number, y: number, onClick: () => void) {
    const container = new Container();
    container.position.set(x, y);
    container.interactive = true;
    container.cursor = "pointer";

    const bg = new Graphics();
    const width = 250;
    const height = 70;
    const radius = 15;
    const color = 0x387478;
    bg.beginFill(color);
    bg.drawRoundedRect(-width / 2, -height / 2, width, height, radius);
    bg.endFill();
    container.addChild(bg);

    const text = new Text(label, { fontSize: 36, fill: 0xffffff, fontWeight: "bold" });
    text.anchor.set(0.5);
    container.addChild(text);

    container.on("pointerover", () => { bg.tint = 0x629584; });
    container.on("pointerout", () => { bg.tint = 0xffffff; container.scale.set(1); });
    container.on("pointerdown", () => { container.scale.set(0.95); setTimeout(() => container.scale.set(1), 100); onClick(); });

    app.stage.addChild(container);
    return container;
  }

  // --- Start Button ---
  const startButton = createButton("START", app.screen.width / 2, app.screen.height / 2, onStart);

  // --- End Button Factory ---
  function createEndButton(label: string, onClick: () => void) {
    return createButton(label, app.screen.width / 2, app.screen.height / 2 + 80, onClick);
  }

  return { startButton, bulletText, asteroidText, timerText, createEndButton };
}
