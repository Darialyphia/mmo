import { GridItem, randomInt, type SpatialHashGrid } from '@mmo/shared';
import type { GameMap } from '../mapgen';
import { GamePlayer } from '../game';
import { EventQueueDependencies } from '../factories/eventQueue';

export type PlayerJoinedEvent = {
  type: 'player joined';
  payload: { playerId: string };
};

const findValidSpawnPosition = (map: GameMap) => {
  let spawnPosition = {
    x: randomInt(map.width),
    y: randomInt(map.height)
  };
  let cell = map.getCellAt(spawnPosition);

  while (cell.height === 0) {
    spawnPosition = {
      x: randomInt(map.width),
      y: randomInt(map.height)
    };
    cell = map.getCellAt(spawnPosition);
  }

  return spawnPosition;
};

export const onPlayerJoined = (
  { playerId }: PlayerJoinedEvent['payload'],
  { map, grid, gridLookup, players, playerLookup }: EventQueueDependencies
): GamePlayer => {
  const player = {
    id: playerId,
    gridItem: grid.add({
      ...findValidSpawnPosition(map),
      w: 1,
      h: 1
    }),
    character: Math.random() > 0.5 ? 'adventurer' : 'enchantress',
    directions: { up: false, down: false, left: false, right: false }
  };

  players.push(player);
  playerLookup.set(player.id, player);
  gridLookup.set(player.gridItem, player);

  return player;
};
