import { GameContext } from './context';
import { findValidSpawnPosition } from '../utils/map';
import {
  GameEntity,
  WithBrand,
  WithFieldOfView,
  WithGridItem,
  WithMovement,
  WithSeeking,
  WithSleep
} from '../types';
import { nanoid } from 'nanoid';
import { MONSTER_FOV, MONSTER_SPEED } from '../constants';

export type Monster = GameEntity &
  WithBrand<'monster'> &
  WithGridItem &
  WithMovement &
  WithFieldOfView &
  WithSeeking &
  WithSleep;

export const isMonster = (x: GameEntity): x is Monster =>
  '__brand' in x && x.__brand === 'monster';

export const createMonster = ({ map, grid }: GameContext) => {
  const monster: Monster = {
    __brand: 'monster',
    id: nanoid(6),
    spriteId: 'rig',
    gridItem: grid.add({
      ...findValidSpawnPosition(map),
      w: 1,
      h: 1
    }),
    orientation: 'right',
    velocity: { x: 0, y: 0 },
    speed: MONSTER_SPEED,
    fov: MONSTER_FOV,
    seeking: {
      target: null,
      canSeek: e => e.__brand === 'player'
    },
    sleep: {
      isAsleep: false,
      sleepDistance: MONSTER_FOV * 1.25
    }
  };

  return monster;
};
