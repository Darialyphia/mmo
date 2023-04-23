import {
  addVector,
  clamp,
  getIntersectionRect,
  setMagnitude
} from '@mmo/shared';
import { GameContext } from '../factories/context';
import {
  GameEntity,
  WithGridItem,
  WithMovement,
  hasGridItem,
  hasMovement
} from '../types';
import { isObstacle } from '../factories/obstacle';
import { System } from 'detect-collisions';

type Movable = GameEntity & WithGridItem & WithMovement;
const isMovable = (x: GameEntity): x is Movable =>
  hasGridItem(x) && hasMovement(x);

export const createMovementSystem = (ctx: GameContext) => {
  const { entities, map, grid } = ctx;

  const computePosition = (entity: Movable, dt: number) => {
    let velocity = setMagnitude(entity.velocity, (entity.speed * dt) / 1000);
    const desiredPos = addVector(
      { x: entity.gridItem.x, y: entity.gridItem.y },
      velocity
    );

    const bounds = {
      min: { x: 0, y: 0 },
      max: { x: map.width - 1, y: map.height - 1 }
    };

    const cell = map.getCellAt(desiredPos);
    if (cell.height === 0) {
      return {
        x: clamp(entity.gridItem.x, bounds.min.x, bounds.max.x),
        y: clamp(entity.gridItem.y, bounds.min.y, bounds.max.y)
      };
    }

    const collidables = grid.findNearby(
      desiredPos,
      { w: entity.gridItem.w, h: entity.gridItem.h },
      g => isObstacle(entities.getByIndex('gridItem', g)!)
    );

    const desiredPosBBox = {
      x: desiredPos.x - entity.gridItem.w / 2,
      y: desiredPos.y - entity.gridItem.h / 2,
      w: entity.gridItem.w,
      h: entity.gridItem.h
    };
    const entityBBox = {
      x: entity.gridItem.x - entity.gridItem.w / 2,
      y: entity.gridItem.y - entity.gridItem.h / 2,
      w: entity.gridItem.w,
      h: entity.gridItem.h
    };

    collidables.forEach(collidable => {
      const collidableBBox = {
        x: collidable.x - collidable.w / 2,
        y: collidable.y - collidable.h / 2,
        w: collidable.w,
        h: collidable.h
      };
      const intersection = getIntersectionRect(desiredPosBBox, collidableBBox);
      console.log(intersection);
      if (
        velocity.x !== 0 &&
        intersection.x > collidableBBox.x &&
        intersection.w < intersection.h
      ) {
        desiredPos.x += intersection.w;
      }
      if (
        velocity.x !== 0 &&
        intersection.x <= collidableBBox.x &&
        intersection.w < intersection.h
      ) {
        desiredPos.x -= intersection.w;
      }
      if (
        velocity.y !== 0 &&
        intersection.y > collidableBBox.y &&
        intersection.w > intersection.h
      ) {
        desiredPos.y += intersection.h;
      }
      if (
        velocity.y !== 0 &&
        intersection.y <= collidableBBox.y &&
        intersection.w > intersection.h
      ) {
        desiredPos.y -= intersection.h;
      }
    });

    return {
      x: clamp(desiredPos.x, 0, map.width - 1),
      y: clamp(desiredPos.y, 0, map.height - 1)
    };
  };

  const getMovables = entities.createFilter<Movable>(isMovable);

  const system = new System();
  return (dt: number) => {
    if (!ctx.featureFlags.movement) return;

    getMovables().forEach(entity => {
      if (entity.velocity.x === 0 && entity.velocity.y === 0) return;

      let desiredPos = computePosition(entity, dt);

      entity.gridItem.x = desiredPos.x;
      entity.gridItem.y = desiredPos.y;
      grid.update(entity.gridItem);
    });
  };
};
