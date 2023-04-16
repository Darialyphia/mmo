import { keyBy } from 'lodash-es';
import { Directions } from '../game';
import { EventQueueDependencies } from '../factories/eventQueue';

export type PlayerMoveEvent = {
  type: 'move';
  payload: { playerId: string; directions: Directions };
};

export const onPlayerMovement = (
  { playerId, directions }: PlayerMoveEvent['payload'],
  { players }: EventQueueDependencies
) => {
  const player = keyBy(players, 'id')[playerId];
  Object.assign(player.directions, directions);
};
