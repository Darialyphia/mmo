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
import { addVector, randomInt } from '@mmo/shared';

export type Obstacle = GameEntity & WithBrand<'obstacle'> & WithGridItem;

export const isObstacle = (x: GameEntity): x is Obstacle =>
  '__brand' in x && x.__brand === 'obstacle';

const OBSTACLES = [
  { spriteId: 'placeholder2x2', size: { w: 1, h: 1 }, offset: 0 },
  // { spriteId: 'placeholder2x3', size: { w: 1, h: 1.5 } },
  // { spriteId: 'placeholder3x2', size: { w: 1.5, h: 1 } },
  // { spriteId: 'placeholder3x3', size: { w: 1.5, h: 1.5 } },
  { spriteId: 'placeholder4x4', size: { w: 2, h: 2 }, offset: 0.5 }
] as const;

export const createObstacle = ({ map, grid }: GameContext) => {
  const props = OBSTACLES[randomInt(OBSTACLES.length - 1)];
  const { x, y } = addVector(findValidSpawnPosition(map), props.offset);
  const obstacle: Obstacle = {
    __brand: 'obstacle',
    id: nanoid(6),
    spriteId: props.spriteId,
    gridItem: grid.add({
      x,
      y,
      ...props.size
    }),
    orientation: 'right'
  };

  return obstacle;
};
