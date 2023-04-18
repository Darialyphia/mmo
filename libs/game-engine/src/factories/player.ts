import { GameContext } from './context';
import { findValidSpawnPosition } from '../utils/map';
import { GameEntity, WithBrand, WithGridItem, WithVelocity } from '../types';

export type Player = GameEntity &
  WithBrand<'player'> &
  WithGridItem &
  WithVelocity;

export const isPlayer = (x: GameEntity): x is Player =>
  '__brand' in x && x.__brand === 'player';

export const createPlayer = (playerId: string, { map, grid }: GameContext) => {
  const player: Player = {
    __brand: 'player',
    id: playerId,
    gridItem: grid.add({
      ...findValidSpawnPosition(map),
      w: 1,
      h: 1
    }),
    orientation: 'right',
    velocity: { x: 0, y: 0 },
    spriteId: Math.random() > 0.5 ? 'adventurer' : 'enchantress'
  };

  return player;
};
