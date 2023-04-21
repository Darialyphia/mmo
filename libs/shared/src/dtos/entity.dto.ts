import type { Point, Size } from '../types';

export type Entity = {
  brand: 'player' | 'monster' | 'obstacle';
  position: Point;
  size: Size;
  spriteId: string;
  id: string;
  orientation: 'left' | 'right';
  path?: Point[];
  fov: number;
};
