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
import cliProgress from 'cli-progress';

export type GameEvents = {
  update: (state: GameStateSnapshot) => void | Promise<void>;
};

export const createGame = () => {
  const context = createContext();
  const emitter = new EventEmitter() as TypedEmitter<GameEvents>;
  const queue = createEventQueue(context);
  const systems = createSystems(context);
  const playerFilter = context.entities.createFilter<Player>(isPlayer);

  console.log('Generating world...');
  const obstaclesBar = new cliProgress.SingleBar(
    {
      format: 'obstacles [{bar}] {percentage}%'
    },
    cliProgress.Presets.shades_classic
  );
  obstaclesBar.start(MAX_OBSTACLES, 0);

  for (let i = 0; i < MAX_OBSTACLES; i++) {
    context.entities.add(createObstacle(context));
    obstaclesBar.increment();
  }
  obstaclesBar.stop();

  const monstersBar = new cliProgress.SingleBar(
    {
      format: 'monsters   [{bar}] {percentage}%'
    },
    cliProgress.Presets.shades_classic
  );
  monstersBar.start(MAX_MONSTERS, 0);
  for (let i = 0; i < MAX_MONSTERS; i++) {
    context.entities.add(createMonster(context));
    monstersBar.increment();
  }
  monstersBar.stop();
  console.log('World generated !');

  let prevTick = 0;
  let interval: Nullable<ReturnType<typeof setInterval>>;

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
      const perfBudget = 1000 / TICK_RATE;

      interval = setInterval(() => {
        const now = performance.now();
        queue.process();
        systems.run(now - prevTick);
        emitter.emit('update', getSnapshot(context, playerFilter));

        const elapsed = performance.now() - now;
        if (elapsed > perfBudget) {
          console.log(
            `tick duration over performance budget by ${(
              elapsed - perfBudget
            ).toFixed(1)}ms`
          );
        }
        prevTick = now;
      }, 1000 / TICK_RATE);
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
