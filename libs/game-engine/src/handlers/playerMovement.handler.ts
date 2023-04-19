import { GameContext } from '../factories/context';
import { Point, setMagnitude } from '@mmo/shared';
import { PLAYER_SPEED } from '../constants';
import { Directions } from '../types';
import { Player } from '../factories/player';

const computeVelocity = (directions: Directions): Point => {
  const vel = { x: 0, y: 0 };
  if (directions.right) {
    vel.x += 1;
  }
  if (directions.left) {
    vel.x -= 1;
  }
  if (directions.up) {
    vel.y -= 1;
  }
  if (directions.down) {
    vel.y += 1;
  }
  return vel;
};

export type PlayerMoveEvent = {
  type: 'move';
  payload: { playerId: string; directions: Directions };
};

export const onPlayerMovement = (
  { playerId, directions }: PlayerMoveEvent['payload'],
  { entities }: GameContext
) => {
  const player = entities.getByIndex('id', playerId);
  if (!player) return;

  player.velocity = computeVelocity(directions);

  if (player.velocity.x < 0) player.orientation = 'left';
  if (player.velocity.x > 0) player.orientation = 'right';
};
