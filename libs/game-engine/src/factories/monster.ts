import { GameContext } from './context';
import { findValidSpawnPosition } from '../utils/map';
import { GameEntity, WithBrand, WithGridItem, WithVelocity } from '../types';
import { nanoid } from 'nanoid';

export type Monster = GameEntity &
  WithBrand<'monster'> &
  WithGridItem &
  WithVelocity;

export const isMonster = (x: GameEntity): x is Monster =>
  '__brand' in x && x.__brand === 'monster';

export const createMonster = ({ map, grid }: GameContext) => {
  const monster: Monster = {
    __brand: 'monster',
    id: nanoid(6),
    gridItem: grid.add({
      ...findValidSpawnPosition(map),
      w: 1,
      h: 1
    }),
    orientation: 'right',
    velocity: { x: 0, y: 0 },
    spriteId: 'zombie'
  };

  return monster;
};
