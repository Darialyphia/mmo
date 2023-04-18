import * as PIXI from 'pixi.js';
import {
  Nullable,
  MapCell,
  Keys,
  isDefined,
  Point,
  GameMeta
} from '@mmo/shared';
import { Tilesets } from '../assets/tilesets';
import { CELL_SIZE } from '../constants';
import { getTileset } from '../caches/tileset';

export const getCellKey = (pt: Point) => `${pt.x}:${pt.y}`;

export const getNeighbors = (
  cell: MapCell,
  map: Map<string, MapCell>,
  meta: GameMeta
): Neighborhood => {
  const { position } = cell;
  const isLeftEdge = position.x === 0;
  const isRightEdge = position.x === meta.width - 1;
  const isTopEdge = position.y === 0;
  const isBottomEdge = position.y === meta.height - 1;

  return [
    [
      isTopEdge && isLeftEdge
        ? null
        : map.get(getCellKey({ x: position.x - 1, y: position.y - 1 })),
      isTopEdge
        ? null
        : map.get(getCellKey({ x: position.x, y: position.y - 1 })),
      isTopEdge && isRightEdge
        ? null
        : map.get(getCellKey({ x: position.x + 1, y: position.y - 1 }))
    ],
    [
      isLeftEdge
        ? null
        : map.get(getCellKey({ x: position.x - 1, y: position.y })),
      cell,
      isRightEdge
        ? null
        : map.get(getCellKey({ x: position.x + 1, y: position.y }))
    ],
    [
      isBottomEdge && isLeftEdge
        ? null
        : map.get(getCellKey({ x: position.x - 1, y: position.y + 1 })),
      isBottomEdge
        ? null
        : map.get(getCellKey({ x: position.x, y: position.y + 1 })),
      isBottomEdge && isRightEdge
        ? null
        : map.get(getCellKey({ x: position.x + 1, y: position.y + 1 }))
    ]
  ];
};

export type NeighborRow = [
  Nullable<MapCell>,
  Nullable<MapCell>,
  Nullable<MapCell>
];
export type Neighborhood = [NeighborRow, NeighborRow, NeighborRow];

export const BIOME_TO_TILESET: Keys<Tilesets>[] = ['snow', 'base', 'desert'];
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

const makeWeightMatcher = (weight: number) => (n: number) => {
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

const applyEdgesTextures = (
  isMatch: (n: number) => boolean,
  addTexture: (
    offset: number,
    x?: number,
    y?: number,
    w?: number,
    h?: number
  ) => void
) => {
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
};

const getWeight = (
  cells: Neighborhood,
  isEdge: (cell: Nullable<MapCell>, centerCell: MapCell) => boolean
) => {
  const centerCell = cells[1][1] as MapCell;
  return cells.flat().reduce((total, cell, index) => {
    if (isEdge(cell, centerCell)) {
      return total * (NEIGHBORS_WEIGHT[index] ?? 1);
    }
    return total;
  }, 1);
};

export const getCellTexture = (
  cells: Neighborhood,
  renderer: PIXI.IRenderer
) => {
  const centerCell = cells[1][1] as MapCell;
  const g = new PIXI.Graphics();

  const addTexture = makeAddTexture(
    BIOME_TO_TILESET[centerCell.temperature] as string,
    g,
    centerCell.height * TILE_ROWS_PER_TERRAIN * TILES_PER_ROW
  );
  const addSeamTexture = makeAddTexture('biomeSeams', g, 0);

  const heightWeight = getWeight(cells, isHeightEdge);
  const biomeWeight = getWeight(cells, isBiomeEdge);

  // add main texture
  addTexture(4);

  if (heightWeight > 0) {
    applyEdgesTextures(makeWeightMatcher(heightWeight), addTexture);
  }

  if (biomeWeight > 0) {
    applyEdgesTextures(makeWeightMatcher(biomeWeight), addSeamTexture);
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
