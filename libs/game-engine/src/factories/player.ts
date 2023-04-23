import { GameContext } from './context';
import { findValidSpawnPosition } from '../utils/map';
import {
  GameEntity,
  WithBrand,
  WithPosition,
  WithMovement,
  WithFieldOfView
} from '../types';
import { PLAYER_FOV, PLAYER_SPEED } from '../constants';

export type Player = GameEntity &
  WithBrand<'player'> &
  WithPosition &
  WithMovement &
  WithFieldOfView;

export const isPlayer = (x: GameEntity): x is Player =>
  '__brand' in x && x.__brand === 'player';

export const createPlayer = (playerId: string, { map, world }: GameContext) => {
  const player: Player = {
    __brand: 'player',
    id: playerId,
    spriteId: 'rig',
    box: world.createBox(findValidSpawnPosition(map), 1, 1),
    orientation: 'right',
    velocity: { x: 0, y: 0 },
    speed: PLAYER_SPEED,
    fov: PLAYER_FOV
  };

  return player;
};
