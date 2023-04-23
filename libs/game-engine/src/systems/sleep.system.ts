import { GameContext } from '../factories/context';
import { hasPosition, hasSleep } from '../types';
import { Player } from '../factories/player';
import { fastDistCheck } from '@mmo/shared';
import { bBoxToRect } from '../utils/entity';

export const createSleepSystem = (ctx: GameContext) => {
  return () => {
    const players = ctx.entities.getByGroup('brand', 'player') as Player[];
    ctx.entities.getList().forEach(entity => {
      if (!hasSleep(entity) || !hasPosition(entity)) return;
      entity.sleep.isAsleep = players.some(
        player =>
          !fastDistCheck(
            bBoxToRect(entity.box),
            bBoxToRect(player.box),
            entity.sleep.sleepDistance
          )
      );
    });
  };
};
