import { createMonsterSpawnSystem } from '../systems/monsterSpawn.system';
import { createMovementSystem } from '../systems/movement.system';
import { createSeekingSystem } from '../systems/seekingSystem';
import { createSleepSystem } from '../systems/sleep.system';
import { GameContext } from './context';

export const createSystems = (ctx: GameContext) => {
  const sleepSystem = createSleepSystem(ctx);
  const movementSystem = createMovementSystem(ctx);
  const monsterSpawnSystem = createMonsterSpawnSystem(ctx);
  const seekingSystem = createSeekingSystem(ctx);

  return {
    run(dt: number) {
      sleepSystem();
      seekingSystem();
      movementSystem(dt);
      monsterSpawnSystem(dt);
    }
  };
};
