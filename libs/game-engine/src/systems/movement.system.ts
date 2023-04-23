import {
  GridItem,
  Point,
  addVector,
  clamp,
  dist,
  rectRectCollision,
  setMagnitude,
  subVector
} from '@mmo/shared';
import { GameContext } from '../factories/context';
import {
  GameEntity,
  WithGridItem,
  WithMovement,
  hasGridItem,
  hasMovement
} from '../types';
import { isWalkable } from '../utils/map';
import { isObstacle } from '../factories/obstacle';

const ENTITY_SEPARATION = 5;
type Movable = GameEntity & WithGridItem & WithMovement;
const isMovable = (x: GameEntity): x is Movable =>
  hasGridItem(x) && hasMovement(x);

export const createMovementSystem = (ctx: GameContext) => {
  const { entities, map, grid } = ctx;

  const getRect = (gridItem: GridItem) => ({
    x: gridItem.x - gridItem.w / 2,
    y: gridItem.y - gridItem.h / 2,
    w: gridItem.w,
    h: gridItem.h
  });

  const computePosition = (entity: Movable, dt: number) => {
    const velocity = setMagnitude(entity.velocity, (entity.speed * dt) / 1000);
    const newPos = addVector(
      { x: entity.gridItem.x, y: entity.gridItem.y },
      velocity
    );

    const bounds = {
      min: { x: 0, y: 0 },
      max: { x: map.width - 1, y: map.height - 1 }
    };

    const cell = map.getCellAt(newPos);
    if (cell.height === 0) {
      return {
        x: clamp(entity.gridItem.x, bounds.min.x, bounds.max.x),
        y: clamp(entity.gridItem.y, bounds.min.y, bounds.max.y)
      };
    }

    const collidables = grid.findNearby(
      newPos,
      { w: entity.gridItem.w, h: entity.gridItem.h },
      g => isObstacle(entities.getByIndex('gridItem', g)!)
    );

    collidables.forEach(collidable => {
      console.log('=======');
      const initialCollision = {
        // prettier-ignore
        left: entity.gridItem.x - entity.gridItem.w / 2 >= collidable.x - collidable.w / 2,
        // prettier-ignore
        right: entity.gridItem.x + entity.gridItem.w / 2 <= collidable.x + collidable.w / 2,
        // prettier-ignore
        top: entity.gridItem.y - entity.gridItem.h / 2 >= collidable.y - collidable.h / 2,
        // prettier-ignore
        bottom: entity.gridItem.y + entity.gridItem.h / 2 <= collidable.y + collidable.h / 2
      };
      const newCollision = {
        // prettier-ignore
        left: newPos.x - entity.gridItem.w / 2 >= collidable.x - collidable.w / 2,
        // prettier-ignore
        right: newPos.x + entity.gridItem.w / 2 <= collidable.x + collidable.w / 2,
        // prettier-ignore
        top: newPos.y - entity.gridItem.h / 2 >= collidable.y - collidable.h / 2,
        // prettier-ignore
        bottom: newPos.y + entity.gridItem.h / 2 <= collidable.y + collidable.h / 2
      };
      console.log(initialCollision, newCollision);
      const shouldAdjustLeft =
        velocity.x !== 0 && collidable.x <= entity.gridItem.x;
      const shouldAdjustright =
        velocity.x !== 0 && collidable.x >= entity.gridItem.x;
      const shouldAdjustTop =
        velocity.y !== 0 && collidable.y <= entity.gridItem.y;
      const shouldAdjustBottom =
        velocity.y !== 0 && collidable.y >= entity.gridItem.y;

      if (shouldAdjustLeft) {
        console.log('adjusting left');
        bounds.min.x = Math.max(
          bounds.min.x,
          collidable.x + collidable.w / 2 + entity.gridItem.w / 2
        );
      }
      if (shouldAdjustright) {
        console.log('adjusting right');

        bounds.max.x = Math.min(
          bounds.max.x,
          collidable.x - collidable.w / 2 - entity.gridItem.w / 2
        );
      }
      if (shouldAdjustTop) {
        console.log('adjusting top');
        bounds.min.y = Math.max(
          bounds.min.y,
          collidable.y + collidable.h / 2 + entity.gridItem.h / 2
        );
      }
      if (shouldAdjustBottom) {
        console.log('adjusting bottom');
        bounds.max.y = Math.min(
          bounds.max.y,
          collidable.y - collidable.h / 2 - entity.gridItem.h / 2
        );
      }
    });

    return {
      x: clamp(newPos.x, bounds.min.x, bounds.max.x),
      y: clamp(newPos.y, bounds.min.y, bounds.max.y)
    };
  };

  const getMovables = entities.createFilter<Movable>(isMovable);
  return (dt: number) => {
    if (!ctx.featureFlags.movement) return;

    getMovables().forEach(entity => {
      if (entity.velocity.x === 0 && entity.velocity.y === 0) return;

      let newPos = computePosition(entity, dt);

      entity.gridItem.x = newPos.x;
      entity.gridItem.y = newPos.y;
      grid.update(entity.gridItem);
    });
  };
};
