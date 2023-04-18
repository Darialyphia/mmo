import { GameContext } from './context';
import { findValidSpawnPosition } from '../utils/map';
import { GameEntity, WithBrand, WithGridItem, WithVelocity } from '../types';

export type GamePlayer = GameEntity &
  WithBrand<'player'> &
  WithGridItem &
  WithVelocity;

export const createPlayer = (playerId: string, { map, grid }: GameContext) => {
  const player: GamePlayer = {
    __brand: 'player',
    id: playerId,
    gridItem: grid.add({
      ...findValidSpawnPosition(map),
      w: 1,
      h: 1
    }),
    orientation: 'right',
    velocity: { x: 0, y: 0 },
    character: Math.random() > 0.5 ? 'adventurer' : 'enchantress'
  };

  return player;
};
