import {
  type Point,
  type Size,
  type Rectangle,
  lerp,
  mulVector
} from '@mmo/shared';
import { CELL_SIZE } from './constants';
import * as PIXI from 'pixi.js';
import type { FrameObject, ISpritesheetData, Spritesheet } from 'pixi.js';

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

export interface AsepriteSheet {
  frames: FrameElement[];
  meta: Meta;
}

export interface FrameElement {
  filename: string;
  frame: Rectangle;
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: Rectangle;
  sourceSize: Size;
  duration: number;
}

export interface Meta {
  app: string;
  version: string;
  image: string;
  format: string;
  size: Size;
  scale: string;
  frameTags: FrameTag[];
  layers: Layer[];
  slices: Slice[];
}

export interface FrameTag {
  name: string;
  from: number;
  to: number;
  direction: string;
}

export interface Layer {
  name: string;
  opacity: number;
  blendMode: string;
}

export interface Slice {
  name: string;
  color: string;
  keys: SliceKey[];
}

export interface SliceKey {
  frame: number;
  bounds: Rectangle;
}

export interface AsepriteSheet {
  frames: FrameElement[];
  meta: Meta;
}

export interface FrameElement {
  filename: string;
  frame: Rectangle;
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: Rectangle;
  sourceSize: Size;
  duration: number;
}

export interface Meta {
  app: string;
  version: string;
  image: string;
  format: string;
  size: Size;
  scale: string;
  frameTags: FrameTag[];
}

export interface FrameTag {
  name: string;
  from: number;
  to: number;
  direction: string;
}

export function parseAsperiteAnimationSheet(
  asepritesheet: AsepriteSheet
): ISpritesheetData {
  return {
    frames: Object.fromEntries(
      asepritesheet.frames.map(frame => {
        const frameName = frame.filename;
        // avoids console warnings with HMR
        if (import.meta.env.DEV) {
          PIXI.Texture.removeFromCache(frameName);
        }
        return [frameName, frame];
      })
    ),
    animations: Object.fromEntries(
      asepritesheet.meta.frameTags.map(tag => [
        tag.name,
        asepritesheet.frames
          .slice(tag.from, tag.to + 1)
          .map(frame => frame.filename)
      ])
    ),
    meta: {
      scale: '1'
    }
  };
}

export const createSpritesheetFrameObject = (
  name: string,
  spritesheet: Spritesheet,
  spritesheetData: ISpritesheetData
): FrameObject[] => {
  const frames = spritesheet.animations[name];
  if (!frames) throw new Error(`unknown animation: ${name}`);

  return frames.map((frame, index) => {
    const frameName = spritesheetData.animations?.[name]?.[index];
    return {
      texture: frame,
      // @ts-ignore bruh
      time: spritesheetData.frames[frameName].duration
    };
  });
};
