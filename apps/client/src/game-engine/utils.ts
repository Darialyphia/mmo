import {
  type Point,
  type Size,
  type Rectangle,
  lerp,
  mulVector,
  clamp,
  MapCellEdge,
  type MapCellAngle,
  isNever,
  type Nullable,
  type MapCell
} from '@mmo/shared';
import { CELL_SIZE } from './constants';
import * as PIXI from 'pixi.js';
import type { FrameObject, ISpritesheetData, Spritesheet } from 'pixi.js';

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

export const countEdges = (edges: [boolean, boolean, boolean, boolean]) =>
  edges.filter(edge => !!edge).length as Exclude<
    MapCellEdge,
    (typeof MapCellEdge)['CORNER']
  >;

export type Edges = [boolean, boolean, boolean, boolean];

export const isParallelTwoSides = (edges: Edges) => {
  const edgesCount = countEdges(edges);
  const [isTopEdge, isBottomEdge, isLeftEdge, isRightEdge] = edges;

  return (
    edgesCount === 2 &&
    ((isTopEdge && isBottomEdge) || (isLeftEdge && isRightEdge))
  );
};

export const computeAngleOneSide = ([
  isTopEdge,
  ,
  isLeftEdge,
  isRightEdge
]: Edges): MapCellAngle => {
  if (isLeftEdge) return 0;
  if (isTopEdge) return 90;
  if (isRightEdge) return 180;
  return 270;
};

export const computeAngleTwoSides = (edges: Edges): MapCellAngle => {
  const [isTopEdge, isBottomEdge, isLeftEdge, isRightEdge] = edges;

  if (isParallelTwoSides(edges)) return isLeftEdge ? 0 : 90;
  if (isLeftEdge && isTopEdge) return 0;
  if (isTopEdge && isRightEdge) return 90;
  if (isRightEdge && isBottomEdge) return 180;

  return 270;
};

export const computeAngleThreeSides = ([
  isTopEdge,
  isBottomEdge,
  ,
  isRightEdge
]: Edges): MapCellAngle => {
  if (!isTopEdge) return 0;
  if (!isRightEdge) return 90;
  if (!isBottomEdge) return 180;
  return 270;
};

export const getEdgeInfos = (edges: Edges) => {
  const edgesCount = countEdges(edges);
  switch (edgesCount) {
    case MapCellEdge.NONE:
      return { edge: edgesCount, angle: 0 };
    case MapCellEdge.ONE_SIDE:
      return { edge: edgesCount, angle: computeAngleOneSide(edges) };
    case MapCellEdge.TWO_SIDES:
      return {
        edge: isParallelTwoSides(edges) ? edgesCount : MapCellEdge.CORNER,
        angle: computeAngleTwoSides(edges)
      };
    case MapCellEdge.THREE_SIDES:
      return { edge: edgesCount, angle: computeAngleThreeSides(edges) };
    case MapCellEdge.ALL_SIDES:
      return { edge: edgesCount, angle: 0 };
    default:
      isNever(edgesCount);
      throw new Error('invalid edge count');
  }
};

export const isHeightEdge = (neighbor: Nullable<MapCell>, cell: MapCell) => {
  if (!isDefined(neighbor)) return false;
  if (neighbor.height !== 0) {
    return (
      neighbor.temperature === cell.temperature && neighbor.height < cell.height
    );
  }
  return neighbor.height < cell.height;
};

export const isBiomeEdge = (neighbor: Nullable<MapCell>, cell: MapCell) => {
  if (!isDefined(neighbor)) return false;
  if (neighbor.height === 0 || cell.height === 0) return false;

  return neighbor.temperature !== cell.temperature;
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
