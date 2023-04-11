import * as PIXI from 'pixi.js';
import { Camera } from './createCamera';

export const createFieldOfView = (camera: Camera, app: PIXI.Application) => {
  const container = new PIXI.Container();

  const graphics = new PIXI.Graphics();
  app.stage.addChild(container);

  graphics.beginFill(0x000000);
  graphics.endFill();

  graphics.drawCircle(0, 0, 250);

  container.addChild(graphics);
  app.ticker.add(() => {
    const { view } = camera;
    graphics.position.set(
      (view.x * view.scale - screen.width / 2) / 2,
      (view.y * view.scale - screen.height / 2) / 2
    );
  });
};
