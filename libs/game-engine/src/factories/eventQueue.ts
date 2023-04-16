import {
  createQueue,
  isNever,
  type SpatialHashGrid,
  GridItem
} from '@mmo/shared';
import type { GamePlayer } from '../game';
import type { GameMap } from '../mapgen';
import {
  PlayerJoinedEvent,
  onPlayerJoined
} from '../handlers/playerJoined.handler';
import {
  PlayerMoveEvent,
  onPlayerMovement
} from '../handlers/playerMovement.handler';
import { PlayerLeftEvent, onPlayerLeft } from '../handlers/playerLeft.handler';

export type GameEvent = PlayerMoveEvent | PlayerJoinedEvent | PlayerLeftEvent;

export type EventQueueDependencies = {
  players: GamePlayer[];
  map: GameMap;
  grid: SpatialHashGrid;
  playerLookup: Map<string, GamePlayer>;
  gridLookup: WeakMap<GridItem, GamePlayer>;
};

export const createEventQueue = (deps: EventQueueDependencies) => {
  return createQueue((event: GameEvent) => {
    const type = event.type;

    switch (type) {
      case 'move':
        onPlayerMovement(event.payload, deps);
        break;
      case 'player joined':
        onPlayerJoined(event.payload, deps);
        break;
      case 'player left':
        onPlayerLeft(event.payload, deps);
        break;
      default:
        isNever(type);
    }
  });
};
