import { createMovementSystem } from '../systems/movement.system';
import { GameContext } from './context';

export const createSystems = (ctx: GameContext) => {
  const movementSystem = createMovementSystem(ctx);

  return {
    run() {
      movementSystem();
    }
  };
};
