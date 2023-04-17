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
  type MapCell,
  isDefined,
  Keys
} from '@mmo/shared';
import { CELL_SIZE } from './constants';
import * as PIXI from 'pixi.js';
import type { FrameObject, ISpritesheetData, Spritesheet } from 'pixi.js';
import { Tilesets } from './assets/tilesets';
import { getTileset } from './createMap';

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

export type NeighborRow = [
  Nullable<MapCell>,
  Nullable<MapCell>,
  Nullable<MapCell>
];
export type Neighborhood = [NeighborRow, NeighborRow, NeighborRow];

const BIOME_TO_TILESET: Keys<Tilesets>[] = ['snow', 'base', 'desert'];
const TILE_ROWS_PER_TERRAIN = 3;
const TILES_PER_ROW = 3;
// prettier-ignore
const NEIGHBORS_WEIGHT = [
  2 , 3 , 5 ,
  7 , 0 , 11,
  13, 17, 19
] as const

const TOP_LEFT = NEIGHBORS_WEIGHT[0];
const TOP = NEIGHBORS_WEIGHT[1];
const TOP_RIGHT = NEIGHBORS_WEIGHT[2];
const LEFT = NEIGHBORS_WEIGHT[3];
const RIGHT = NEIGHBORS_WEIGHT[5];
const BOTTOM_LEFT = NEIGHBORS_WEIGHT[6];
const BOTTOM = NEIGHBORS_WEIGHT[7];
const BOTTOM_RIGHT = NEIGHBORS_WEIGHT[8];

const isWeightMatch = (weight: number) => (n: number) => {
  return weight % n === 0;
};

const makeAddTexture = (
  tilesetName: string,
  g: PIXI.Graphics,
  startIndex: number
) => {
  const tileset = getTileset(tilesetName);

  return (offset: number, x = 0, y = 0, w = CELL_SIZE, h = CELL_SIZE) => {
    const textureName = `${tilesetName}-${startIndex + offset}`;

    g.beginTextureFill({
      texture: tileset.textures[textureName]
    });
    g.drawRect(x, y, w, h);
  };
};

const EDGE_SIZE = CELL_SIZE / 4;
export const getCellTexture = (
  cells: Neighborhood,
  renderer: PIXI.IRenderer
) => {
  const centerCell = cells[1][1] as MapCell;
  const tilesetName = BIOME_TO_TILESET[centerCell.temperature] as string;
  const g = new PIXI.Graphics();

  const addTexture = makeAddTexture(
    tilesetName,
    g,
    centerCell.height * TILE_ROWS_PER_TERRAIN * TILES_PER_ROW
  );
  const addSeamTexture = makeAddTexture('biomeSeams', g, 0);

  const heightWeight = cells.flat().reduce((total, cell, index) => {
    if (isHeightEdge(cell, centerCell)) {
      return total * (NEIGHBORS_WEIGHT[index] ?? 1);
    }
    return total;
  }, 1);
  const biomeWeight = cells.flat().reduce((total, cell, index) => {
    if (isBiomeEdge(cell, centerCell)) {
      return total * (NEIGHBORS_WEIGHT[index] ?? 1);
    }
    return total;
  }, 1);

  addTexture(4);
  if (heightWeight > 0) {
    const isMatch = isWeightMatch(heightWeight);
    if (isMatch(TOP)) {
      addTexture(1, 0, 0, CELL_SIZE, EDGE_SIZE);
    }
    if (isMatch(RIGHT)) {
      addTexture(5, CELL_SIZE - EDGE_SIZE, 0, EDGE_SIZE, CELL_SIZE);
    }
    if (isMatch(BOTTOM)) {
      addTexture(7, 0, CELL_SIZE - EDGE_SIZE, CELL_SIZE, EDGE_SIZE);
    }
    if (isMatch(LEFT)) {
      addTexture(3, 0, 0, EDGE_SIZE, CELL_SIZE);
    }

    if (isMatch(TOP_LEFT)) {
      if (isMatch(LEFT) && isMatch(TOP)) {
        addTexture(0, 0, 0, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(LEFT)) {
        addTexture(3, 0, 0, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(TOP)) {
        addTexture(1, 0, 0, EDGE_SIZE, EDGE_SIZE);
      } else {
        addTexture(2, 0, 0, EDGE_SIZE, EDGE_SIZE);
      }
    }

    if (isMatch(TOP_RIGHT)) {
      if (isMatch(RIGHT) && isMatch(TOP)) {
        addTexture(2, CELL_SIZE - EDGE_SIZE, 0, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(RIGHT)) {
        addTexture(5, CELL_SIZE - EDGE_SIZE, 0, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(TOP)) {
        addTexture(1, CELL_SIZE - EDGE_SIZE, 0, EDGE_SIZE, EDGE_SIZE);
      } else {
        addTexture(0, CELL_SIZE - EDGE_SIZE, 0, EDGE_SIZE, EDGE_SIZE);
      }
    }

    if (isMatch(BOTTOM_RIGHT)) {
      if (isMatch(RIGHT) && isMatch(BOTTOM)) {
        //prettier-ignore
        addTexture(8, CELL_SIZE - EDGE_SIZE, CELL_SIZE - EDGE_SIZE, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(RIGHT)) {
        //prettier-ignore
        addTexture(5, CELL_SIZE - EDGE_SIZE, CELL_SIZE - EDGE_SIZE, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(BOTTOM)) {
        //prettier-ignore
        addTexture(7, CELL_SIZE - EDGE_SIZE, CELL_SIZE - EDGE_SIZE, EDGE_SIZE, EDGE_SIZE);
      } else {
        //prettier-ignore
        addTexture(6,CELL_SIZE - EDGE_SIZE, CELL_SIZE - EDGE_SIZE,EDGE_SIZE, EDGE_SIZE);
      }
    }

    if (isMatch(BOTTOM_LEFT)) {
      if (isMatch(LEFT) && isMatch(BOTTOM)) {
        addTexture(6, 0, CELL_SIZE - EDGE_SIZE, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(LEFT)) {
        addTexture(3, 0, CELL_SIZE - EDGE_SIZE, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(BOTTOM)) {
        addTexture(7, 0, CELL_SIZE - EDGE_SIZE, EDGE_SIZE, EDGE_SIZE);
      } else {
        addTexture(8, 0, CELL_SIZE - EDGE_SIZE, EDGE_SIZE, EDGE_SIZE);
      }
    }
  }

  if (biomeWeight > 0) {
    const isMatch = isWeightMatch(biomeWeight);
    if (isMatch(TOP)) {
      addSeamTexture(1, 0, 0, CELL_SIZE, EDGE_SIZE);
    }
    if (isMatch(RIGHT)) {
      addSeamTexture(5, CELL_SIZE - EDGE_SIZE, 0, EDGE_SIZE, CELL_SIZE);
    }
    if (isMatch(BOTTOM)) {
      addSeamTexture(7, 0, CELL_SIZE - EDGE_SIZE, CELL_SIZE, EDGE_SIZE);
    }
    if (isMatch(LEFT)) {
      addSeamTexture(3, 0, 0, EDGE_SIZE, CELL_SIZE);
    }

    if (isMatch(TOP_LEFT)) {
      if (isMatch(LEFT) && isMatch(TOP)) {
        addSeamTexture(0, 0, 0, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(LEFT)) {
        addSeamTexture(3, 0, 0, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(TOP)) {
        addSeamTexture(1, 0, 0, EDGE_SIZE, EDGE_SIZE);
      } else {
        addSeamTexture(2, 0, 0, EDGE_SIZE, EDGE_SIZE);
      }
    }

    if (isMatch(TOP_RIGHT)) {
      if (isMatch(RIGHT) && isMatch(TOP)) {
        addSeamTexture(2, CELL_SIZE - EDGE_SIZE, 0, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(RIGHT)) {
        addSeamTexture(5, CELL_SIZE - EDGE_SIZE, 0, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(TOP)) {
        addSeamTexture(1, CELL_SIZE - EDGE_SIZE, 0, EDGE_SIZE, EDGE_SIZE);
      } else {
        addSeamTexture(0, CELL_SIZE - EDGE_SIZE, 0, EDGE_SIZE, EDGE_SIZE);
      }
    }

    if (isMatch(BOTTOM_RIGHT)) {
      if (isMatch(RIGHT) && isMatch(BOTTOM)) {
        //prettier-ignore
        addSeamTexture(8, CELL_SIZE - EDGE_SIZE, CELL_SIZE - EDGE_SIZE, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(RIGHT)) {
        //prettier-ignore
        addSeamTexture(5, CELL_SIZE - EDGE_SIZE, CELL_SIZE - EDGE_SIZE, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(BOTTOM)) {
        //prettier-ignore
        addSeamTexture(7, CELL_SIZE - EDGE_SIZE, CELL_SIZE - EDGE_SIZE, EDGE_SIZE, EDGE_SIZE);
      } else {
        //prettier-ignore
        addSeamTexture(6,CELL_SIZE - EDGE_SIZE, CELL_SIZE - EDGE_SIZE,EDGE_SIZE, EDGE_SIZE);
      }
    }

    if (isMatch(BOTTOM_LEFT)) {
      if (isMatch(LEFT) && isMatch(BOTTOM)) {
        addSeamTexture(6, 0, CELL_SIZE - EDGE_SIZE, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(LEFT)) {
        addSeamTexture(3, 0, CELL_SIZE - EDGE_SIZE, EDGE_SIZE, EDGE_SIZE);
      } else if (isMatch(BOTTOM)) {
        addSeamTexture(7, 0, CELL_SIZE - EDGE_SIZE, EDGE_SIZE, EDGE_SIZE);
      } else {
        addSeamTexture(8, 0, CELL_SIZE - EDGE_SIZE, EDGE_SIZE, EDGE_SIZE);
      }
    }
  }

  return renderer.generateTexture(g);
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
