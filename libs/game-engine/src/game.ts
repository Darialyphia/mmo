import { randomInt } from 'crypto';
import { createMap } from './mapgen';
import { EventEmitter } from 'events';
import { keyBy } from 'lodash-es';
import {
  type GridItem,
  type MapCell,
  type Player,
  createSpatialHashGrid,
  isNever
} from '@mmo/shared';
import type TypedEmitter from 'typed-emitter';
import { createMovementSystem } from './systems/movementSystem';
import { PLAYER_FOV, TICK_RATE } from './constants';
import { createTaskQueue } from './taskQueue';

export type GameEvents = {
  update: (state: GameStateSnapshot) => void;
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

type MoveEvent = {
  type: 'move';
  payload: { playerId: string; directions: Directions };
};

type OtherEvent = {
  type: 'test';
  payload: boolean;
};

type GameEvent = MoveEvent | OtherEvent;

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
  const movementSystem = createMovementSystem(map, grid);

  const handleEvent = (event: GameEvent) => {
    const type = event.type;
    switch (type) {
      case 'move':
        // eslint-disable-next-line no-case-declarations
        const player = keyBy(players, 'id')[event.payload.playerId];
        Object.assign(player.directions, event.payload.directions);
        break;
      case 'test':
        break;
      default:
        isNever(type);
    }
  };

  const removePlayer = (playerId: string) => {
    const idx = players.findIndex(p => p.id === playerId);
    if (idx < 0) return;
    players.splice(idx, 1);
  };

  const createPlayer = (id: string) => {
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

    const player = {
      gridItem: grid.add({
        ...spawnPosition,
        w: 1,
        h: 1
      }),
      id,
      color: randomInt(360),
      directions: { up: false, down: false, left: false, right: false }
    };

    players.push(player);
  };

  const emitter = new EventEmitter() as TypedEmitter<GameEvents>;
  const queue = createTaskQueue();

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
  const tick = () => {
    queue.process();
    movementSystem(players);

    emitter.emit('update', getSnapshot());
  };

  setInterval(tick, 1000 / TICK_RATE);

  return {
    get meta() {
      return {
        width: map.width,
        height: map.height
      };
    },
    createPlayer,
    removePlayer,
    schedule(event: GameEvent) {
      queue.schedule(() => handleEvent(event));
    },
    on: emitter.on.bind(emitter)
  };
};
