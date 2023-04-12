import { clamp, lerp, type Point } from '@mmo/shared';
import { Application, Container, Graphics } from 'pixi.js';
import { CELL_SIZE } from './constants';
import type { Layer } from '@pixi/layers';

export type Camera = ReturnType<typeof createCamera>;

export const createCamera = (app: Application) => {
  const container = new Container();
  container.scale.set(2, 2);
  container.position.set(app.screen.width / 2, app.screen.height / 2);
  const setPosition = () => {
    container.position.set(app.screen.width / 2, app.screen.height / 2);
  };
  window.addEventListener('resize', setPosition);

  const fow = new Graphics();

  container.addChild(fow);
  return {
    container,
    cleanup() {
      window.removeEventListener('resize', setPosition);
    },

    update({ x, y }: Point) {
      const newPivot = {
        x: lerp(1, [container.pivot.x, x]),
        y: lerp(1, [container.pivot.y, y])
      };

      container.pivot.set(
        clamp(
          newPivot.x,
          app.screen.width / 2 / container.scale.x - CELL_SIZE / 2,
          (app.stage.width - app.screen.width / 2) / container.scale.x -
            CELL_SIZE / 2
        ),
        clamp(
          newPivot.y,
          app.screen.height / 2 / container.scale.y - CELL_SIZE / 2,
          (app.stage.height - app.screen.height / 2) / container.scale.y -
            CELL_SIZE / 2
        )
      );

      fow.clear();
      fow.beginFill(0xff0000);
      fow.drawCircle(container.pivot.x, container.pivot.y, 200);
      fow.endFill();
    }
  };
};
