import { createQueue, isNever } from '@mmo/shared';
import {
  PlayerJoinedEvent,
  onPlayerJoined
} from '../handlers/playerJoined.handler';
import {
  PlayerMoveEvent,
  onPlayerMovement
} from '../handlers/playerMovement.handler';
import { PlayerLeftEvent, onPlayerLeft } from '../handlers/playerLeft.handler';
import { GameContext } from './context';

export type GameEvent = PlayerMoveEvent | PlayerJoinedEvent | PlayerLeftEvent;

export const createEventQueue = (ctx: GameContext) => {
  return createQueue((event: GameEvent) => {
    const type = event.type;

    switch (type) {
      case 'move':
        onPlayerMovement(event.payload, ctx);
        break;
      case 'player joined':
        onPlayerJoined(event.payload, ctx);
        break;
      case 'player left':
        onPlayerLeft(event.payload, ctx);
        break;
      default:
        isNever(type);
    }
  });
};
