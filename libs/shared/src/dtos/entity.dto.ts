import type { Point } from '../types';

export type Entity = {
  position: Point;
  spriteId: string;
  id: string;
  orientation: 'left' | 'right';
  path?: Point[];
};
