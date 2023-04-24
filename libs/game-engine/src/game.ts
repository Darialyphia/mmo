import { EventEmitter } from 'events';
import type TypedEmitter from 'typed-emitter';
import type { Nullable } from '@mmo/shared';
import { MAX_MONSTERS, MAX_OBSTACLES, TICK_RATE } from './constants';
import { createEventQueue, type GameEvent } from './factories/eventQueue';
import { createSystems } from './factories/systems';
import {
  GameStateSnapshot,
  createContext,
  getSnapshot
} from './factories/context';
import { createObstacle } from './factories/obstacle';
import { Player, isPlayer } from './factories/player';
import { createMonster } from './factories/monster';

export type GameEvents = {
  update: (state: GameStateSnapshot) => void | Promise<void>;
};

const perfBudget = 1000 / TICK_RATE;
const perfWarning = (elapsed: number) => {
  console.log(
    `tick duration over performance budget by ${(elapsed - perfBudget).toFixed(
      1
    )}ms`
  );
};
export const createGame = () => {
  console.log('Generating world...');
  console.log('Creating map...');
  const context = createContext();
  const emitter = new EventEmitter() as TypedEmitter<GameEvents>;
  const queue = createEventQueue(context);
  const systems = createSystems(context);
  const playerFilter = context.entities.createFilter<Player>(isPlayer);

  console.log('Creating obstacles...');
  for (let i = 0; i < MAX_OBSTACLES; i++) {
    context.entities.add(createObstacle(context));
  }

  console.log('Creating monsters...');
  for (let i = 0; i < MAX_MONSTERS; i++) {
    context.entities.add(createMonster(context));
  }

  console.log('World generated !');

  let prevTick = 0;
  let interval: Nullable<ReturnType<typeof setInterval>>;

  const runTick = () => {
    const now = performance.now();
    queue.process();
    systems.run(now - prevTick);
    emitter.emit('update', getSnapshot(context, playerFilter));

    const elapsed = performance.now() - now;
    if (elapsed > perfBudget) {
      perfWarning(elapsed);
    }
    prevTick = now;
  };

  const engine = {
    get meta() {
      return {
        width: context.map.width,
        height: context.map.height
      };
    },

    get isRunning() {
      return !!interval;
    },

    start() {
      if (engine.isRunning) return;
      prevTick = performance.now();

      interval = setInterval(runTick, 1000 / TICK_RATE);
    },

    stop() {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
    },

    schedule(event: GameEvent) {
      queue.dispatch(event);
    },

    on: emitter.on.bind(emitter)
  };

  return engine;
};
