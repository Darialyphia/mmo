import { Entity, GridItem, Point } from '@mmo/shared';

export type GameEntity = Omit<Entity, 'position'>;
export type WithBrand<T extends string> = { __brand: T };
export type WithGridItem = { gridItem: GridItem };
export type WithVelocity = { velocity: Point };
export type WithOrientation = { orientation: 'left' | 'right' };

export type Directions = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};
