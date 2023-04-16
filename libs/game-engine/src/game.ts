import { createMap } from './mapgen';
import { EventEmitter } from 'events';
import { keyBy } from 'lodash-es';
import {
  type GridItem,
  type MapCell,
  type Entity,
  createSpatialHashGrid,
  isNever,
  type Nullable
} from '@mmo/shared';
import type TypedEmitter from 'typed-emitter';
import { createMovementSystem } from './systems/movementSystem';
import { PLAYER_FOV, TICK_RATE } from './constants';
import { createEventQueue, type GameEvent } from './factories/eventQueue';

export type GameEvents = {
  update: (state: GameStateSnapshot) => void | Promise<void>;
};

export type GamePlayer = Omit<Entity, 'position'> & {
  directions: Directions;
  gridItem: GridItem;
};

export type GameStateSnapshot = {
  fieldOfView: Record<string, { cells: MapCell[]; entities: Entity[] }>;
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
  const playerLookup = new Map<string, GamePlayer>();
  const grid = createSpatialHashGrid({
    dimensions: { w: map.width, h: map.height },
    bounds: {
      start: { x: 0, y: 0 },
      end: { x: map.width, y: map.height }
    }
  });
  const gridLookup = new WeakMap<GridItem, GamePlayer>();
  const emitter = new EventEmitter() as TypedEmitter<GameEvents>;
  const queue = createEventQueue({
    map,
    grid,
    players,
    playerLookup,
    gridLookup
  });

  const movementSystem = createMovementSystem(map, grid);

  const getSnapshot = (): GameStateSnapshot => {
    const fieldOfView = Object.fromEntries(
      players.map(player => {
        const entities = grid
          .findNearbyRadius(
            { x: player.gridItem.x, y: player.gridItem.y },
            PLAYER_FOV
          )
          .map(gridItem => {
            const player = gridLookup.get(gridItem)!;
            return {
              id: player.id,
              character: player.character,
              position: { x: player.gridItem.x, y: player.gridItem.y }
            };
          });
        const cells = map.getFieldOfView(player.gridItem, PLAYER_FOV);

        return [player.id, { entities, cells }];
      })
    );

    return { fieldOfView };
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
