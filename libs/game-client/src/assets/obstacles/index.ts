import type { ObstacleResource } from '../types';
import { placeholder2x2 } from './placeholder2x2';
import { placeholder2x3 } from './placeholder2x3';
import { placeholder3x2 } from './placeholder3x2';
import { placeholder3x3 } from './placeholder3x3';
import { placeholder4x4 } from './placeholder4x4';

export const obstacles = {
  placeholder2x2,
  placeholder2x3,
  placeholder3x2,
  placeholder3x3,
  placeholder4x4
} satisfies Record<string, ObstacleResource>;

export type Obstacles = typeof obstacles;

export const obstaclesBundle = Object.fromEntries(
  Object.entries(obstacles).map(([k, v]) => [k, v.url])
);
