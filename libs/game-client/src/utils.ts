import { type Point, type Size, lerp, mulVector } from '@mmo/shared';
import { CELL_SIZE } from './constants';
import * as PIXI from 'pixi.js';

export const enablePIXIDevtools = (app: PIXI.Application) => {
  if (import.meta.env.DEV) {
    // @ts-ignore enables PIXI devtools
    window.PIXI = PIXI;
    // @ts-ignore enables PIXI devtools
    window.__PIXI_APP__ = app;
  }
};
export const coordsToPixels = (point: Point) => mulVector(point, CELL_SIZE);
export const dimensionsToPixels = ({ w, h }: Size) => {
  const mapped = mulVector({ x: w, y: h }, CELL_SIZE);

  return { w: mapped.x, h: mapped.y };
};

export type InterPolationState<T extends Point> = {
  value: T;
  timestamp: number;
};

export type InterpolateOptions = {
  now?: number;
};

export const interpolateEntity = <T extends Point = Point>(
  newState: InterPolationState<T>,
  oldState: InterPolationState<T>,
  { now = performance.now() }: InterpolateOptions
): Point => {
  const delta = now - newState.timestamp;
  const statesDelta = newState.timestamp - oldState.timestamp;
  const interpFactor = delta / statesDelta;

  return {
    x: lerp(interpFactor, [oldState.value.x, newState.value.x]),
    y: lerp(interpFactor, [oldState.value.y, newState.value.y])
  };
};
