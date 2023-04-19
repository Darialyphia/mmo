import { GameContext } from './context';
import { findValidSpawnPosition } from '../utils/map';
import {
  GameEntity,
  WithBrand,
  WithGridItem,
  WithMovement,
  WithFieldOfView
} from '../types';
import { PLAYER_FOV, PLAYER_SPEED } from '../constants';

export type Player = GameEntity &
  WithBrand<'player'> &
  WithGridItem &
  WithMovement &
  WithFieldOfView;

export const isPlayer = (x: GameEntity): x is Player =>
  '__brand' in x && x.__brand === 'player';

export const createPlayer = (playerId: string, { map, grid }: GameContext) => {
  const player: Player = {
    __brand: 'player',
    id: playerId,
    spriteId: Math.random() > 0.5 ? 'adventurer' : 'enchantress',
    gridItem: grid.add({
      ...findValidSpawnPosition(map),
      w: 1,
      h: 1
    }),
    orientation: 'right',
    velocity: { x: 0, y: 0 },
    speed: PLAYER_SPEED,
    fov: PLAYER_FOV
  };

  return player;
};
