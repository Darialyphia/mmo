import {
  Rectangle,
  addVector,
  clamp,
  dist,
  getIntersectionRect,
  setMagnitude,
  subVector
} from '@mmo/shared';
import { GameContext } from '../factories/context';
import {
  GameEntity,
  WithPosition,
  WithMovement,
  hasPosition,
  hasMovement
} from '../types';
import { isObstacle } from '../factories/obstacle';
import { System } from 'detect-collisions';
import { isCellWalkable } from '../utils/map';
import { isMonster } from '../factories/monster';
import { isPlayer } from '../factories/player';

type Movable = GameEntity & WithPosition & WithMovement;
const isMovable = (x: GameEntity): x is Movable =>
  hasPosition(x) && hasMovement(x);

export const createMovementSystem = (ctx: GameContext) => {
  const { entities, world, map } = ctx;

  const getMovables = entities.createFilter<Movable>(isMovable);

  return (dt: number) => {
    if (!ctx.featureFlags.movement) return;

    getMovables().forEach(entity => {
      if (entity.velocity.x === 0 && entity.velocity.y === 0) return;

      let velocity = setMagnitude(entity.velocity, (entity.speed * dt) / 1000);
      const newPosition = {
        x: clamp(entity.box.x + velocity.x, 0, map.width - 1),
        y: clamp(entity.box.y + velocity.y, 0, map.height - 1)
      };

      entity.box.setPosition(newPosition.x, newPosition.y);
    });

    world.checkAll(({ a, b, overlapV }) => {
      if (a.isStatic && b.isStatic) {
        return;
      }
      if (!a.isStatic && b.isStatic) {
        return a.setPosition(a.pos.x - overlapV.x, a.pos.y - overlapV.y);
      }

      if (!b.isStatic && a.isStatic) {
        return b.setPosition(a.pos.x + overlapV.x, a.pos.y + overlapV.y);
      }

      const aEntity = entities.getByIndex('box', a)!;
      const bEntity = entities.getByIndex('box', b)!;

      if (!isPlayer(aEntity)) {
        return a.setPosition(a.pos.x - overlapV.x, a.pos.y - overlapV.y);
      }
      // if (!isPlayer(bEntity)) {
      //   return b.setPosition(a.pos.x + overlapV.x, a.pos.y + overlapV.y);
      // }
    });
    // world.separate();
  };
};
