import { GameContext } from './context';
import { findValidSpawnPosition } from '../utils/map';
import { GameEntity, WithBrand, WithPosition } from '../types';
import { nanoid } from 'nanoid';
import { addVector, randomInt } from '@mmo/shared';

export type Obstacle = GameEntity & WithBrand<'obstacle'> & WithPosition;

export const isObstacle = (x: GameEntity): x is Obstacle =>
  '__brand' in x && x.__brand === 'obstacle';

const OBSTACLES = [
  { spriteId: 'placeholder2x2', size: { w: 1, h: 1 } },
  { spriteId: 'placeholder2x3', size: { w: 1, h: 1.5 } },
  { spriteId: 'placeholder3x2', size: { w: 1.5, h: 1 } },
  { spriteId: 'placeholder3x3', size: { w: 1.5, h: 1.5 } },
  { spriteId: 'placeholder4x4', size: { w: 2, h: 2 } }
] as const;

export const createObstacle = ({ map, world }: GameContext) => {
  const props = OBSTACLES[randomInt(OBSTACLES.length - 1)];

  const obstacle: Obstacle = {
    __brand: 'obstacle',
    id: nanoid(6),
    spriteId: props.spriteId,
    box: world.createBox(
      findValidSpawnPosition(map),
      props.size.w,
      props.size.h,
      { isStatic: true }
    ),
    orientation: 'right'
  };

  return obstacle;
};
