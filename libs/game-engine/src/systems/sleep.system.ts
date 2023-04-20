import { GameContext } from '../factories/context';
import { createMonster, isMonster } from '../factories/monster';
import { MAX_MONSTERS, MONSTER_SPAWN_THRESHOLD } from '../constants';
import { hasGridItem, hasSleep } from '../types';
import { Player } from '../factories/player';
import { fastDistCheck } from '@mmo/shared';

export const createSleepSystem = (ctx: GameContext) => {
  return () => {
    const players = ctx.entities.getByGroup('brand', 'player') as Player[];
    ctx.entities.getList().forEach(entity => {
      if (!hasSleep(entity) || !hasGridItem(entity)) return;
      entity.sleep.isAsleep = players.some(
        player =>
          !fastDistCheck(
            entity.gridItem,
            player.gridItem,
            entity.sleep.sleepDistance
          )
      );
    });
  };
};
