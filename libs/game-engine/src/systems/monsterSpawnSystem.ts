import { addVector, clamp } from '@mmo/shared';
import { GameContext } from '../factories/context';
import { createMonster, isMonster } from '../factories/monster';
import { MAX_MONSTERS } from '../constants';

export const createMonsterSpawnSystem = (ctx: GameContext) => {
  return (tick: number) => {
    if (tick % 50 !== 0) return;
    const count = ctx.entities.filter(isMonster).length;
    if (count >= MAX_MONSTERS) return;

    console.log('spawning monster');
    const monster = createMonster(ctx);

    ctx.entities.push(monster);
    ctx.entitiesLookup.set(monster.id, monster);
    ctx.gridLookup.set(monster.gridItem, monster);
  };
};
