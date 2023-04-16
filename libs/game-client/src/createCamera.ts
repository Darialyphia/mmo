import { clamp, lerp, type GameMeta, type Point } from '@mmo/shared';
import { Application, Container, Graphics } from 'pixi.js';
import { CELL_SIZE } from './constants';

export type Camera = ReturnType<typeof createCamera>;

type CreateCameraOptions = {
  app: Application;
  meta: GameMeta;
};

export const createCamera = ({ app, meta }: CreateCameraOptions) => {
  const container = new Container();
  container.scale.set(2, 2);
  container.position.set(app.screen.width / 2, app.screen.height / 2);
  const setPosition = () => {
    container.position.set(app.screen.width / 2, app.screen.height / 2);
  };
  window.addEventListener('resize', setPosition);

  const fow = new Graphics();
  fow.zIndex = 2;

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
      const halfScreenWidth = app.screen.width / 2 / container.scale.x;
      const halfScreenHeight = app.screen.height / 2 / container.scale.y;

      container.pivot.set(
        clamp(
          newPivot.x,
          halfScreenWidth - CELL_SIZE / 2,
          meta.width * CELL_SIZE - halfScreenWidth - CELL_SIZE / 2
        ),
        clamp(
          newPivot.y,
          halfScreenHeight - CELL_SIZE / 2,
          meta.height * CELL_SIZE - halfScreenHeight - CELL_SIZE / 2
        )
      );

      fow.clear();
      fow.beginFill(0x000000, 0.5);
      fow.drawRect(
        container.pivot.x - app.screen.width / container.scale.x,
        container.pivot.y - app.screen.height / container.scale.y,
        app.screen.width * 2,
        app.screen.height * 2
      );
      fow.beginHole();
      fow.drawCircle(newPivot.x, newPivot.y, CELL_SIZE * 9);
      fow.endHole();
      fow.endFill();
    }
  };
};
