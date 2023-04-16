import { keyBy } from 'lodash-es';
import { Directions } from '../game';
import { EventQueueDependencies } from '../factories/eventQueue';

export type PlayerLeftEvent = {
  type: 'player left';
  payload: { playerId: string };
};

export const onPlayerLeft = (
  { playerId }: PlayerLeftEvent['payload'],
  { players, playerLookup, grid, gridLookup }: EventQueueDependencies
) => {
  const player = playerLookup.get(playerId);
  if (!player) {
    throw new Error(`could not find player ${playerId}`);
  }
  players.splice(players.indexOf(player), 1);
  grid.remove(player.gridItem);
  playerLookup.delete(player.id);
  gridLookup.delete(player.gridItem);
};
