import { createMonsterSpawnSystem } from '../systems/monsterSpawn.system';
import { createMovementSystem } from '../systems/movement.system';
import { createSeekingSystem } from '../systems/seekingSystem';
import { GameContext } from './context';

export const createSystems = (ctx: GameContext) => {
  const movementSystem = createMovementSystem(ctx);
  const monsterSpawnSystem = createMonsterSpawnSystem(ctx);
  const seekingSystem = createSeekingSystem(ctx);

  return {
    run(dt: number) {
      seekingSystem();
      movementSystem(dt);
      monsterSpawnSystem(dt);
    }
  };
};
