import { randomInt } from 'crypto';
import { createMap } from './mapgen';
import { EventEmitter } from 'events';
import { MapLayout, Player, clamp, isNever } from '@mmo/shared';
import { keyBy } from 'lodash-es';

type GamePlayer = Player & { directions: Directions };

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

const createTaskQueue = <TTask extends () => void>() => {
  const tasks: TTask[] = [];
  return {
    schedule(task: TTask) {
      tasks.push(task);
    },

    process() {
      let task = tasks.shift();
      while (task) {
        task();

        task = tasks.shift();
      }
    }
  };
};

const createMovementSystem = (map: MapLayout) => {
  const speed = 1;
  return (players: GamePlayer[]) => {
    players.forEach(player => {
      if (player.directions.up) {
        player.position.y -= speed;
      }
      if (player.directions.down) {
        player.position.y += speed;
      }
      if (player.directions.left) {
        player.position.x -= speed;
      }
      if (player.directions.right) {
        player.position.x += speed;
      }
      player.position.x = clamp(player.position.x, 0, map.width - 1);
      player.position.y = clamp(player.position.y, 0, map.height - 1);
    });
  };
};

export const createGame = () => {
  const map = createMap();
  const players: GamePlayer[] = [];
  const movementSystem = createMovementSystem(map);

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
    const player = {
      position: { x: randomInt(map.width), y: randomInt(map.height) },
      id,
      color: randomInt(360),
      directions: { up: false, down: false, left: false, right: false }
    };

    players.push(player);
  };

  const emitter = new EventEmitter();
  const queue = createTaskQueue();

  const tick = () => {
    queue.process();
    movementSystem(players);

    emitter.emit('update', {
      players
    });
  };

  const TICK_RATE = 15;
  setInterval(tick, 1000 / TICK_RATE);

  return {
    map,
    createPlayer,
    removePlayer,
    dispatch(event: GameEvent) {
      queue.schedule(() => handleEvent(event));
    },
    on: emitter.on.bind(emitter)
  };
};
