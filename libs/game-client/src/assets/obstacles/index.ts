import type { ObstacleResource } from '../types';
import { tree } from './tree';

export const obstacles = {
  tree
} satisfies Record<string, ObstacleResource>;

export type Obstacles = typeof obstacles;

export const obstaclesBundle = Object.fromEntries(
  Object.entries(obstacles).map(([k, v]) => [k, v.url])
);
