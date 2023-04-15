import { mapRange, Point } from '@mmo/shared';
import { CHUNK_SIZE } from '../constants';
import { Noise2D } from 'open-simplex-noise/lib/2d';
import { isDefined, type Nullable } from '@mmo/shared';

type CellNeighbors = {
  top: Nullable<number>;
  bottom: Nullable<number>;
  left: Nullable<number>;
  right: Nullable<number>;
};

const getNeighbors = (index: number, map: number[]): CellNeighbors => {
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

const MAX_PASSES = 100;
// This wil smoothen sharp transition between terrain
// for example if a grass tile is next to a water tile, it will replace it with a sand tile
// as soon as one tile has been changed, the whole chunk need to be rechecked again as this could have cascading effects
// this is handling inconsistencies at the seams between chunks. Whatever for now.
export const fixNoiseMap = (chunk: number[], maxPasses = MAX_PASSES) => {
  let needsAdjustmentPass = true;
  let passCount = 0;

  const doAdjustmentPass = () => {
    needsAdjustmentPass = false;
    passCount++;

    const newMap = chunk.map((terrain, index) => {
      const neighbors = getNeighbors(index, chunk);
      let adjustedHeight: Nullable<number> = null;

      Object.values(neighbors)
        .filter(isDefined)
        .forEach(nHeight => {
          if (isDefined(adjustedHeight)) return;

          const diff = terrain - nHeight;
          if (Math.abs(diff) <= 1) return;

          needsAdjustmentPass = true;
          const adj = diff > 0 ? -1 : 1;

          adjustedHeight = terrain + adj;
        });

      return adjustedHeight ?? terrain;
    });

    chunk = newMap;
  };

  while (needsAdjustmentPass && passCount < maxPasses) {
    doAdjustmentPass();
  }

  return chunk;
};

type Noise2Fn = (x: number, y: number) => number;

export type NoiseRectangleOptions = {
  startsAt: Point;
  amplitude: number;
  frequency: number;
  octaves: number;
  persistence: number;
  scale?: (x: number) => number;
};

export const makeNoiseRectangle = (
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

type NoiseChunkOptions = {
  startsAt: Point;
  noise: Noise2D;
  frequency: number;
  octaves: number;
  mapFn: (n: number) => number;
  fix?: boolean;
};
export const generateNoiseChunk = ({
  startsAt,
  noise,
  frequency,
  octaves,
  mapFn,
  fix = true
}: NoiseChunkOptions) => {
  const chunk = makeNoiseRectangle((x, y) => noise(x, y), {
    startsAt,
    frequency,
    octaves,
    amplitude: 2,
    persistence: 0.5,
    scale: mapFn
  }).flat() as number[];

  return fix ? fixNoiseMap(chunk) : chunk;
};

export const sampleNoise = (
  height: number,
  distributionMap: Record<number, number>
): number => {
  const normalized = mapRange(height, [-1, 1], [0, 1]);

  const key = (Math.round(normalized * 20) / 2) * 10;

  return distributionMap[key];
};
