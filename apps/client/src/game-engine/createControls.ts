import type { Point, Values } from '@mmo/shared';
import type { Camera } from './createCamera';

export const CAMERA_MIN_SCALE = 0.25;
export const CAMERA_MAX_SCALE = 2;
export const CAMERA_ROTATE_SCALE = 90;
export const CAMERA_SCALE_STEP = 0.1;
export const ONE_FRAME_IN_MS = 16;

export const KeyboardControls = Object.freeze({
  W: 'KeyW',
  S: 'KeyS',
  A: 'KeyA',
  D: 'KeyD'
});
export type KeyboardControls = Values<typeof KeyboardControls>;

export type PlayerControlsOptions = {
  canvas: HTMLCanvasElement;
  camera: Camera;
  mousePosition: Point;
};

export type Directions = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export class PlayerControls {
  private canvas!: HTMLCanvasElement;

  private camera!: Camera;

  private mousePosition!: Point;

  private directions: Directions = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  // private isPlayerMovementEnabled = false;

  constructor(opts: PlayerControlsOptions) {
    Object.assign(this, opts);

    this.handleMovement();
  }

  // enablePlayerMovement() {
  //   this.isPlayerMovementEnabled = true;
  //   return this;
  // }

  // disablePlayerMovement() {
  //   this.isPlayerMovementEnabled = false;
  //   return this;
  // }

  handleMovement() {
    const keyMap: Record<string, keyof typeof this.directions> = {
      [KeyboardControls.W]: 'up',
      [KeyboardControls.S]: 'down',
      [KeyboardControls.A]: 'left',
      [KeyboardControls.D]: 'right'
    };

    useKeydownOnce(e => {
      const direction = keyMap[e.code];
      if (direction) {
        this.directions[direction] = true;
      }
    });

    document.addEventListener('keyup', e => {
      const direction = keyMap[e.code];
      if (direction) {
        this.directions[direction] = false;
      }
    });
  }
}
