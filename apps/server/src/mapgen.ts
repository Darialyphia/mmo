import {
  mapRange,
  isNever,
  type MapCellAngle,
  type MapLayout,
  type MapCell,
  type Nullable,
  type Values,
  isDefined,
  MapCellEdge,
  Point,
  clamp,
  Keys,
  dist
} from '@mmo/shared';
import { makeRectangle } from 'fractal-noise';
import { makeNoise2D } from 'open-simplex-noise';

type TerrainMap = Terrain[];

type Terrain = Values<typeof TERRAINS>;
type CellNeighbors = {
  top: Nullable<Terrain>;
  bottom: Nullable<Terrain>;
  left: Nullable<Terrain>;
  right: Nullable<Terrain>;
};

type GameMap = MapLayout & {
  getCellAt(pt: Point): MapCell;
  getFieldOfView(pt: Point, fov: number): MapCell[];
};
const WIDTH = 50;
const HEIGHT = 50;
// const SEED = 12345;

const TERRAINS = {
  WATER: 0,
  SAND: 1,
  GRASS: 2,
  ROCKS: 3
} as const;

const TERRAIN_DISTRIBUTION_MAP = {
  0: TERRAINS.WATER,
  5: TERRAINS.WATER,
  10: TERRAINS.WATER,
  15: TERRAINS.WATER,
  20: TERRAINS.WATER,
  25: TERRAINS.WATER,
  30: TERRAINS.WATER,
  35: TERRAINS.WATER,
  40: TERRAINS.WATER,
  45: TERRAINS.SAND,
  50: TERRAINS.SAND,
  55: TERRAINS.GRASS,
  60: TERRAINS.GRASS,
  65: TERRAINS.GRASS,
  70: TERRAINS.GRASS,
  75: TERRAINS.GRASS,
  80: TERRAINS.GRASS,
  85: TERRAINS.GRASS,
  90: TERRAINS.GRASS,
  95: TERRAINS.GRASS,
  100: TERRAINS.GRASS
} as const;

const makeTerrainMap = (seed?: number): TerrainMap => {
  const noise2D = makeNoise2D(seed ?? Date.now());

  const heightMap = makeRectangle(WIDTH, HEIGHT, (x, y) => noise2D(x, y), {
    frequency: 0.08,
    octaves: 4,
    amplitude: 2,
    scale: noiseValueToTerrain
  });

  let map = heightMap.flat() as Terrain[];

  let needsAdjustmentPass = true;
  let passCount = 0;
  const MAX_PASSES = 100;

  // This wil smoothen sharp transition between terrain
  // for example if a grass tile is next to a water tile, it will replace it with a sand tile
  // as soon as one tile has been changed, the whole map need to be rechecked again as this could have cascading effects
  const doAdjustmentPass = () => {
    needsAdjustmentPass = false;
    passCount++;

    const newMap = map.map((terrain, index) => {
      const neighbors = getNeighbors(index, map);
      let adjustedTerrain: Nullable<Terrain> = null;

      Object.values(neighbors)
        .filter(isDefined)
        .forEach(nTerrain => {
          if (isDefined(adjustedTerrain)) return;

          const diff = terrain - nTerrain;
          if (Math.abs(diff) <= 1) return;

          needsAdjustmentPass = true;
          const adj = diff > 0 ? -1 : 1;

          adjustedTerrain = (terrain + adj) as Terrain;
        });

      return adjustedTerrain ?? terrain;
    });

    map = newMap;
  };

  while (needsAdjustmentPass && passCount < MAX_PASSES) {
    doAdjustmentPass();
  }

  return map;
};

const noiseValueToTerrain = (
  height: number
): Values<typeof TERRAIN_DISTRIBUTION_MAP> => {
  const normalized = mapRange(height, [-1, 1], [0, 1]);

  const key = ((Math.round(normalized * 20) / 2) * 10) as Keys<
    typeof TERRAIN_DISTRIBUTION_MAP
  >;
  return TERRAIN_DISTRIBUTION_MAP[key];
};

const getNeighbors = (index: number, map: TerrainMap): CellNeighbors => {
  const isLeftEdge = index % WIDTH === 0;
  const isRightEdge = index % WIDTH === WIDTH - 1;
  const isTopEdge = index < WIDTH;
  const isBottomEdge = map.length - 1 - index < WIDTH;

  return {
    top: isTopEdge ? null : map[index - WIDTH],
    bottom: isBottomEdge ? null : map[index + WIDTH],
    left: isLeftEdge ? null : map[index - 1],
    right: isRightEdge ? null : map[index + 1]
  };
};

const countEdges = (edges: [boolean, boolean, boolean, boolean]) =>
  edges.filter(edge => !!edge).length as Exclude<
    MapCellEdge,
    (typeof MapCellEdge)['CORNER']
  >;

type Edges = [boolean, boolean, boolean, boolean];

const isParallelTwoSides = (edges: Edges) => {
  const edgesCount = countEdges(edges);
  const [isTopEdge, isBottomEdge, isLeftEdge, isRightEdge] = edges;

  return (
    edgesCount === 2 &&
    ((isTopEdge && isBottomEdge) || (isLeftEdge && isRightEdge))
  );
};

const computeAngleOneSide = ([
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

const computeAngleTwoSides = (edges: Edges): MapCellAngle => {
  const [isTopEdge, isBottomEdge, isLeftEdge, isRightEdge] = edges;

  if (isParallelTwoSides(edges)) return isLeftEdge ? 0 : 90;
  if (isLeftEdge && isTopEdge) return 0;
  if (isTopEdge && isRightEdge) return 90;
  if (isRightEdge && isBottomEdge) return 180;

  return 270;
};

const computeAngleThreeSides = ([
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

const computeEdges = (
  index: number,
  map: TerrainMap
  // @ts-ignore ts dumb
): Pick<MapCell, 'edge' | 'angle'> => {
  const cell = map[index];
  const neighbors = getNeighbors(index, map);

  const edges: [boolean, boolean, boolean, boolean] = [
    isDefined(neighbors.top) && neighbors.top < cell,
    isDefined(neighbors.bottom) && neighbors.bottom < cell,
    isDefined(neighbors.left) && neighbors.left < cell,
    isDefined(neighbors.right) && neighbors.right < cell
  ];
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
  }
};

const makeCell = (index: number, map: TerrainMap): MapCell => {
  return {
    terrain: map[index],
    ...computeEdges(index, map),
    position: {
      x: index % WIDTH,
      y: Math.floor(index / WIDTH)
    }
  };
};

export const createMap = (): GameMap => {
  const terrainMap = makeTerrainMap(12345);
  const cells = terrainMap.map((_, index) => makeCell(index, terrainMap));

  const getCellAt = ({ x, y }: Point) => cells[y * WIDTH + x];

  return {
    width: WIDTH,
    height: HEIGHT,
    getCellAt,
    getFieldOfView({ x, y }, fov) {
      const min = {
        x: clamp(x - fov, 0, WIDTH - 1),
        y: clamp(y - fov, 0, HEIGHT - 1)
      };
      const max = {
        x: clamp(x + fov, 0, WIDTH - 1),
        y: clamp(y + fov, 0, HEIGHT - 1)
      };

      const cells: MapCell[] = [];
      for (let cellX = min.x; cellX <= max.x; cellX++) {
        for (let cellY = min.y; cellY <= max.y; cellY++) {
          const isVisible = dist({ x, y }, { x: cellX, y: cellY }) <= fov;
          if (isVisible) {
            cells.push(getCellAt({ x, y }));
          }
        }
      }
      return cells;
    },
    cells
  };
};
