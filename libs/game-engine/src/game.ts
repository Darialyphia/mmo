import { createMap } from './mapgen';
import { EventEmitter } from 'events';
import { keyBy } from 'lodash-es';
import {
  type GridItem,
  type MapCell,
  type Player,
  createSpatialHashGrid,
  isNever,
  type Nullable
} from '@mmo/shared';
import type TypedEmitter from 'typed-emitter';
import { createMovementSystem } from './systems/movementSystem';
import { PLAYER_FOV, TICK_RATE } from './constants';
import { createPlayer } from './factories/playerFactory';
import { createEventQueue, type GameEvent } from './factories/eventQueue';

export type GameEvents = {
  update: (state: GameStateSnapshot) => void | Promise<void>;
};

export type GamePlayer = Omit<Player, 'position'> & {
  directions: Directions;
  gridItem: GridItem;
};

export type GameStateSnapshot = {
  players: Player[];
  fieldOfView: Record<string, MapCell[]>;
};

export type Directions = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export const createGame = () => {
  const map = createMap();
  const players: GamePlayer[] = [];
  const grid = createSpatialHashGrid({
    dimensions: { w: map.width, h: map.height },
    bounds: {
      start: { x: 0, y: 0 },
      end: { x: map.width, y: map.height }
    }
  });
  const emitter = new EventEmitter() as TypedEmitter<GameEvents>;
  const queue = createEventQueue({ map, grid, players });

  const movementSystem = createMovementSystem(map, grid);

  const getSnapshot = () => {
    const playerDtos: GameStateSnapshot['players'] = [];
    const fov: GameStateSnapshot['fieldOfView'] = {};

    players.forEach(player => {
      playerDtos.push({
        id: player.id,
        color: player.color,
        position: { x: player.gridItem.x, y: player.gridItem.y }
      });

      fov[player.id] = map.getFieldOfView(player.gridItem, PLAYER_FOV);
    });

    return { players: playerDtos, fieldOfView: fov };
  };

  let interval: Nullable<ReturnType<typeof setInterval>>;

  return {
    get meta() {
      return {
        width: map.width,
        height: map.height
      };
    },

    start() {
      interval = setInterval(() => {
        queue.process();
        movementSystem(players);

        emitter.emit('update', getSnapshot());
      }, 1000 / TICK_RATE);
    },

    stop() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    },

    get isRunning() {
      return !!interval;
    },

    schedule(event: GameEvent) {
      queue.dispatch(event);
    },

    on: emitter.on.bind(emitter)
  };
};
