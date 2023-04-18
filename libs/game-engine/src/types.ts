import { Entity, GridItem, Point } from '@mmo/shared';

export type Directions = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export type GameEntity = Omit<Entity, 'position'>;

export type WithBrand<T extends string> = { __brand: T };
export const hasBrand = (x: GameEntity): x is GameEntity & WithBrand<string> =>
  '__brand' in x;

export type WithGridItem = { gridItem: GridItem };
export const hasGridItem = (x: GameEntity): x is GameEntity & WithGridItem =>
  'gridItem' in x;

export type WithVelocity = { velocity: Point };
export const hasVelocity = (x: GameEntity): x is GameEntity & WithVelocity =>
  'velocity' in x;

export type WithOrientation = { orientation: 'left' | 'right' };
export const hasOrientation = (
  x: GameEntity
): x is GameEntity & WithOrientation => 'orientation' in x;
