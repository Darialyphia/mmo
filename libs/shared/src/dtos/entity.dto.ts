import type { Point } from '../types';

export type Entity = {
  brand: 'player' | 'monster' | 'obstacle';
  position: Point;
  spriteId: string;
  id: string;
  orientation: 'left' | 'right';
  path?: Point[];
};
