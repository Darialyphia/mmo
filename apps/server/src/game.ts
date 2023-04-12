import { randomInt } from 'crypto';
import { createMap } from './mapgen';
import { EventEmitter } from 'events';
import { Point, clamp } from '@mmo/shared';

export type Player = {
  position: Point;
  color: number;
  id: string;
};

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

export const createGame = () => {
  const map = createMap();
  const players: Player[] = [];

  const createPlayer = (id: string) => {
    const user = {
      position: { x: randomInt(map.width), y: randomInt(map.height) },
      id,
      color: randomInt(360)
    };

    players.push(user);

    return user;
  };

  const removePlayer = (player: Player) => {
    players.splice(players.indexOf(player), 1);
  };

  const movePlayer = (
    player: Player,
    direction: 'up' | 'down' | 'left' | 'right'
  ) => {
    switch (direction) {
      case 'up':
        player.position.y = clamp(player.position.y - 1, 0, map.height - 1);
        break;
      case 'down':
        player.position.y = clamp(player.position.y + 1, 0, map.height - 1);
        break;
      case 'left':
        player.position.x = clamp(player.position.x - 1, 0, map.width - 1);
        break;
      case 'right':
        player.position.x = clamp(player.position.x + 1, 0, map.width - 1);
        break;
    }
  };

  const emitter = new EventEmitter();
  const queue = createTaskQueue();

  const tick = () => {
    queue.process();

    emitter.emit('update', {
      players
    });
  };

  const TICK_RATE = 10;
  setInterval(tick, 1000 / TICK_RATE);

  return {
    map,
    createPlayer,
    removePlayer,
    movePlayer,
    on: emitter.on.bind(emitter)
  };
};
