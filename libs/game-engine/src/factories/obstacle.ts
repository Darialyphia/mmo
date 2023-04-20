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

export type Obstacle = GameEntity & WithBrand<'obstacle'> & WithGridItem;

export const isObstacle = (x: GameEntity): x is Obstacle =>
  '__brand' in x && x.__brand === 'obstacle';

export const createObstacle = ({ map, grid }: GameContext) => {
  const obstacle: Obstacle = {
    __brand: 'obstacle',
    id: nanoid(6),
    spriteId: 'tree',
    gridItem: grid.add({
      ...findValidSpawnPosition(map),
      w: 1,
      h: 1
    }),
    orientation: 'right'
  };

  return obstacle;
};
