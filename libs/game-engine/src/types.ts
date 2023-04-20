import { Entity, GridItem, Nullable, Point } from '@mmo/shared';

export type Directions = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export type GameEntity = Omit<Entity, 'position'>;
export type GameEntityId = string;

export type WithBrand<T extends string> = { __brand: T };
export const hasBrand = (x: GameEntity): x is GameEntity & WithBrand<string> =>
  '__brand' in x;

export type WithGridItem = { gridItem: GridItem };
export const hasGridItem = (x: GameEntity): x is GameEntity & WithGridItem =>
  'gridItem' in x;

export type WithMovement = { velocity: Point; speed: number };
export const hasMovement = (x: GameEntity): x is GameEntity & WithMovement =>
  'velocity' in x && 'speed' in x;

export type WithFieldOfView = { fov: number };
export const hasFieldOfView = (
  x: GameEntity
): x is GameEntity & WithFieldOfView => 'fov' in x;

export type WithOrientation = { orientation: 'left' | 'right' };
export const hasOrientation = (
  x: GameEntity
): x is GameEntity & WithOrientation => 'orientation' in x;

export type WithSeeking = {
  seeking: {
    target: Nullable<GameEntityId>;
    canSeek: (e: GameEntity & WithBrand<string>) => boolean;
  };
};
export const hasSeeking = (x: GameEntity): x is GameEntity & WithSeeking =>
  'seeking' in x;
