import {
  mapRange,
  isNever,
  type MapCellAngle,
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
import { makeNoise2D } from 'open-simplex-noise';
import { Noise2D } from 'open-simplex-noise/lib/2d';

type Height = Values<typeof HEIGHTS>;
type CellNeighbors = {
  top: Nullable<Height>;
  bottom: Nullable<Height>;
  left: Nullable<Height>;
  right: Nullable<Height>;
};
type Noise2Fn = (x: number, y: number) => number;

const WIDTH = 500;
const HEIGHT = 500;
const CHUNK_SIZE = 25;
// const SEED = 12345;

const HEIGHTS = {
  SEA_LEVEL: 0,
  BEACH: 1,
  GROUND: 2,
  ROCKS: 3
} as const;

const HEIGHT_DISTRIBUTION_MAP = {
  0: HEIGHTS.SEA_LEVEL,
  5: HEIGHTS.SEA_LEVEL,
  10: HEIGHTS.SEA_LEVEL,
  15: HEIGHTS.SEA_LEVEL,
  20: HEIGHTS.SEA_LEVEL,
  25: HEIGHTS.SEA_LEVEL,
  30: HEIGHTS.SEA_LEVEL,
  35: HEIGHTS.SEA_LEVEL,
  40: HEIGHTS.SEA_LEVEL,
  45: HEIGHTS.BEACH,
  50: HEIGHTS.BEACH,
  55: HEIGHTS.GROUND,
  60: HEIGHTS.GROUND,
  65: HEIGHTS.GROUND,
  70: HEIGHTS.GROUND,
  75: HEIGHTS.GROUND,
  80: HEIGHTS.GROUND,
  85: HEIGHTS.GROUND,
  90: HEIGHTS.GROUND,
  95: HEIGHTS.GROUND,
  100: HEIGHTS.GROUND
} as const;

type NoiseRectangleOptions = {
  startsAt: Point;
  amplitude: number;
  frequency: number;
  octaves: number;
  persistence: number;
  scale?: (x: number) => number;
};

const makeNoiseRectangle = (
  noise2: Noise2Fn,
  {
    amplitude,
    frequency,
    octaves,
    persistence,
    scale = x => x,
    startsAt
  }: NoiseRectangleOptions
): number[][] => {
  const field: number[][] = new Array(CHUNK_SIZE);
  for (let y = 0; y < CHUNK_SIZE; y++) {
    field[y] = new Array(CHUNK_SIZE);
    for (let x = 0; x < CHUNK_SIZE; x++) {
      let value = 0.0;
      for (let octave = 0; octave < octaves; octave++) {
        const freq = frequency * Math.pow(2, octave);
        const n = noise2((startsAt.x + x) * freq, (startsAt.y + y) * freq);
        value += n * (amplitude * Math.pow(persistence, octave));
      }
      const scaled = scale(value / (2 - 1 / Math.pow(2, octaves - 1)));
      field[y][x] = scaled;
    }
  }
  return field;
};

const noiseValueToHeight = (
  height: number
): Values<typeof HEIGHT_DISTRIBUTION_MAP> => {
  const normalized = mapRange(height, [-1, 1], [0, 1]);

  const key = ((Math.round(normalized * 20) / 2) * 10) as Keys<
    typeof HEIGHT_DISTRIBUTION_MAP
  >;
  return HEIGHT_DISTRIBUTION_MAP[key];
};

const chunks = new Map<string, MapCell[]>();
const getChunkKey = ({ x, y }: Point) => `${x}:${y}`;

const generateChunk = (startsAt: Point, heightNoise: Noise2D) => {
  const heightMap = makeNoiseRectangle((x, y) => heightNoise(x, y), {
    startsAt,
    frequency: 0.08,
    octaves: 4,
    amplitude: 2,
    persistence: 0.5,
    scale: noiseValueToHeight
  });

  let chunk = heightMap.flat() as Height[];

  let needsAdjustmentPass = true;
  let passCount = 0;
  const MAX_PASSES = 100;

  // This wil smoothen sharp transition between terrain
  // for example if a grass tile is next to a water tile, it will replace it with a sand tile
  // as soon as one tile has been changed, the whole chunk need to be rechecked again as this could have cascading effects
  // this is handling inconsistencies at the seams between chunks. Whatever for now.
  const doAdjustmentPass = () => {
    needsAdjustmentPass = false;
    passCount++;

    const newMap = chunk.map((terrain, index) => {
      const neighbors = getNeighbors(index, chunk);
      let adjustedHeight: Nullable<Height> = null;

      Object.values(neighbors)
        .filter(isDefined)
        .forEach(nHeight => {
          if (isDefined(adjustedHeight)) return;

          const diff = terrain - nHeight;
          if (Math.abs(diff) <= 1) return;

          needsAdjustmentPass = true;
          const adj = diff > 0 ? -1 : 1;

          adjustedHeight = (terrain + adj) as Height;
        });

      return adjustedHeight ?? terrain;
    });

    chunk = newMap;
  };

  while (needsAdjustmentPass && passCount < MAX_PASSES) {
    doAdjustmentPass();
  }

  const cells = chunk.map((cell, index) => {
    return {
      terrain: cell,
      ...computeEdges(index, chunk),
      position: {
        x: startsAt.x + (index % CHUNK_SIZE),
        y: startsAt.y + Math.floor(index / CHUNK_SIZE)
      }
    };
  });

  return cells;
};

const getOrCreateChunk = (startsAt: Point, baseSeed: number) => {
  const key = getChunkKey(startsAt);

  if (!chunks.has(key)) {
    const heightSeed = baseSeed;
    const heightNoise = makeNoise2D(heightSeed);
    // const temperatureSeed = heightSeed + 1;
    // const temperatureNoise = makeNoise2D(temperatureSeed ?? Date.now());

    chunks.set(key, generateChunk(startsAt, heightNoise));
  }

  return chunks.get(key)!;
};

const getNeighbors = (index: number, map: Height[]): CellNeighbors => {
  const isLeftEdge = index % CHUNK_SIZE === 0;
  const isRightEdge = index % CHUNK_SIZE === CHUNK_SIZE - 1;
  const isTopEdge = index < CHUNK_SIZE;
  const isBottomEdge = map.length - 1 - index < CHUNK_SIZE;

  return {
    top: isTopEdge ? null : map[index - CHUNK_SIZE],
    bottom: isBottomEdge ? null : map[index + CHUNK_SIZE],
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
  map: Height[]
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

export const createMap = () => {
  const seed = 12345;

  const getCellAt = ({ x, y }: Point) => {
    const chunkOrigin = {
      x: Math.floor(x / CHUNK_SIZE) * CHUNK_SIZE,
      y: Math.floor(y / CHUNK_SIZE) * CHUNK_SIZE
    };

    const cells = getOrCreateChunk(chunkOrigin, seed);

    return cells[(y - chunkOrigin.y) * CHUNK_SIZE + x - chunkOrigin.x];
  };

  return {
    width: WIDTH,
    height: HEIGHT,
    getFieldOfView({ x, y }: Point, fov: number) {
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
            cells.push(getCellAt({ x: cellX, y: cellY }));
          }
        }
      }
      return cells;
    }
  };
};
