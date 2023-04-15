import type { Point } from '../types';
import type { Values } from '../types/utils';

export type MapCellAngle = 0 | 90 | 180 | 270;

export type MapCell = {
  height: number;
  temperature: number;
  position: Point;
};

export type MapLayout = {
  width: number;
  height: number;
  cells: MapCell[];
};

export const MapCellEdge = {
  NONE: 0,
  ONE_SIDE: 1,
  TWO_SIDES: 2,
  THREE_SIDES: 3,
  ALL_SIDES: 4,
  CORNER: 5
} as const;

export type MapCellEdge = Values<typeof MapCellEdge>;
