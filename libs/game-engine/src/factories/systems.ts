import { createMonsterSpawnSystem } from '../systems/monsterSpawnSystem';
import { createMovementSystem } from '../systems/movement.system';
import { GameContext } from './context';

export const createSystems = (ctx: GameContext) => {
  const movementSystem = createMovementSystem(ctx);
  const monsterSpawnSystem = createMonsterSpawnSystem(ctx);

  return {
    run(dt: number) {
      movementSystem(dt);
      monsterSpawnSystem(dt);
    }
  };
};
