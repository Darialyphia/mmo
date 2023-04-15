import {
  createQueue,
  type AnyObject,
  type Values,
  isNever,
  type SpatialHashGrid
} from '@mmo/shared';
import { keyBy } from 'lodash-es';
import type { Directions, GamePlayer } from '../game';
import { createPlayer } from './playerFactory';
import type { GameMap } from '../mapgen';

type MoveEvent = {
  type: 'move';
  payload: { playerId: string; directions: Directions };
};

type PlayerJoinedEvent = {
  type: 'player joined';
  payload: { playerId: string };
};

type PlayerLeftEvent = {
  type: 'player left';
  payload: { playerId: string };
};

export type GameEvent = MoveEvent | PlayerJoinedEvent | PlayerLeftEvent;

export type EventQueueOptions = {
  players: GamePlayer[];
  map: GameMap;
  grid: SpatialHashGrid;
};

export const createEventQueue = ({ players, map, grid }: EventQueueOptions) => {
  return createQueue((event: GameEvent) => {
    const type = event.type;

    switch (type) {
      case 'move':
        const player = keyBy(players, 'id')[event.payload.playerId];
        Object.assign(player.directions, event.payload.directions);
        break;
      case 'player joined':
        players.push(createPlayer(event.payload.playerId, { map, grid }));
        break;
      case 'player left':
        const idx = players.findIndex(p => p.id === event.payload.playerId);
        if (idx < 0) return;
        players.splice(idx, 1);
        break;
      default:
        isNever(type);
    }
  });
};
