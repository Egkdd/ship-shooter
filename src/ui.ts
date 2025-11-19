import { Application, Text, Container, Graphics } from "pixi.js";

export interface UI {
  startButton: Container;
  bulletText: Text;
  asteroidText: Text;
  timerText: Text;
  createEndButton: (label: string, onClick: () => void) => Container;
}

// Константи стилів і розмірів
const FONT_SIZE = 32;
const BUTTON_WIDTH = 250;
const BUTTON_HEIGHT = 90;
const BUTTON_RADIUS = 15;
const BUTTON_COLOR = 0x387478;
const BUTTON_HOVER = 0x629584;
const BUTTON_TEXT_SIZE = 36;
const BUTTON_TEXT_COLOR = 0xffffff;

// Ініціалізація UI гри
export function setupUI(
  app: Application,
  initialAmmo: number,
  asteroidCount: number,
  onStart: () => void
): UI {
  // Тексти для боєприпасів, астероїдів та таймера
  const bulletText = new Text(`Bullets: ${initialAmmo}`, {
    fontSize: FONT_SIZE,
    fill: 0xffffff,
    fontWeight: "bold",
  });
  bulletText.position.set(10, 10);
  app.stage.addChild(bulletText);

  const asteroidText = new Text(`Asteroids: ${asteroidCount}`, {
    fontSize: FONT_SIZE,
    fill: 0xffffff,
    fontWeight: "bold",
  });
  asteroidText.position.set(10, 40);
  app.stage.addChild(asteroidText);

  const timerText = new Text("01:00", {
    fontSize: FONT_SIZE,
    fill: 0xffffff,
    fontWeight: "bold",
  });
  timerText.position.set(app.screen.width - 100, 10);
  app.stage.addChild(timerText);

  // Функція створення кнопки
  function createButton(
    label: string,
    x: number,
    y: number,
    onClick: () => void
  ) {
    const container = new Container();
    container.position.set(x, y);
    container.interactive = true;
    container.cursor = "pointer";

    // Фон кнопки
    const bg = new Graphics();
    bg.beginFill(BUTTON_COLOR);
    bg.drawRoundedRect(
      -BUTTON_WIDTH / 2,
      -BUTTON_HEIGHT / 2,
      BUTTON_WIDTH,
      BUTTON_HEIGHT,
      BUTTON_RADIUS
    );
    bg.endFill();
    container.addChild(bg);

    // Текст кнопки
    const text = new Text(label, {
      fontSize: BUTTON_TEXT_SIZE,
      fill: BUTTON_TEXT_COLOR,
      fontWeight: "bold",
    });
    text.anchor.set(0.5);
    container.addChild(text);

    // Події курсора
    container.on("pointerover", () => {
      bg.tint = BUTTON_HOVER;
    });
    container.on("pointerout", () => {
      bg.tint = 0xffffff;
      container.scale.set(1);
    });
    container.on("pointerdown", () => {
      container.scale.set(0.95);
      setTimeout(() => container.scale.set(1), 100);
      onClick();
    });

    app.stage.addChild(container);
    return container;
  }

  // Кнопка старту гри
  const startButton = createButton(
    "START",
    app.screen.width / 2,
    app.screen.height / 2,
    onStart
  );

  // Фабрика для кнопки завершення
  function createEndButton(label: string, onClick: () => void) {
    return createButton(
      label,
      app.screen.width / 2,
      app.screen.height / 2 + 80,
      onClick
    );
  }

  return { startButton, bulletText, asteroidText, timerText, createEndButton };
}
