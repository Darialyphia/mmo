import { addVector, clamp } from '@mmo/shared';
import { GameContext } from '../factories/context';
import { createMonster, isMonster } from '../factories/monster';
import { MAX_MONSTERS, MONSTER_SPAWN_THRESHOLD } from '../constants';

export const createMonsterSpawnSystem = (ctx: GameContext) => {
  let spawnBar = 0;

  return (dt: number) => {
    const count = ctx.entities.filter(isMonster).length;
    if (count >= MAX_MONSTERS) return;
    spawnBar += dt;
    if (spawnBar < MONSTER_SPAWN_THRESHOLD) return;

    const monster = createMonster(ctx);

    ctx.entities.push(monster);
    ctx.entitiesLookup.set(monster.id, monster);
    ctx.gridLookup.set(monster.gridItem, monster);
    spawnBar = spawnBar % MONSTER_SPAWN_THRESHOLD;
  };
};
