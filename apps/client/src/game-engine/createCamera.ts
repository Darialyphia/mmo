import { lerp, type Point } from '@mmo/shared';
import type { DisplayObject, Rectangle } from 'pixi.js';

export type CameraView = Point & {
  scale: number;
};

export type Camera = ReturnType<typeof createCamera>;

export const createCamera = (defaults: Partial<CameraView> = {}) => {
  const view: CameraView = Object.assign(
    {
      x: 0,
      y: 0,
      scale: 2
    },
    defaults
  );

  return {
    get view() {
      return { ...view };
    },

    update(newView: Partial<CameraView>) {
      Object.assign(view, newView);
    },

    apply(screen: Rectangle, target: DisplayObject) {
      // we are multiplying the view position by -1 because it is actually the stage that is moving, not the camera
      // so if want to scroll to the right for example, we need to move the stage to he left

      target.pivot.set(
        lerp(0.1, [target.position.x, view.x * view.scale + screen.width / 2]),
        lerp(0.1, [target.position.y, view.y * view.scale + screen.height / 2])
      );
      target.scale.set(view.scale, view.scale);
    }
  };
};
