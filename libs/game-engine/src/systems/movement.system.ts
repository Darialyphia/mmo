import {
  addVector,
  clamp,
  dist,
  divVector,
  isDefined,
  rectRectCollision,
  setMagnitude,
  subVector
} from '@mmo/shared';
import { GameContext } from '../factories/context';
import { hasGridItem, hasMovement } from '../types';

const ENTITY_SEPARATION = 0.5;

export const createMovementSystem = ({ entities, map, grid }: GameContext) => {
  return (dt: number) => {
    entities.getList().forEach(entity => {
      if (!hasGridItem(entity) || !hasMovement(entity)) return;
      if (entity.velocity.x === 0 && entity.velocity.y === 0) return;

      grid
        .findNearby(entity.gridItem, { w: 1, h: 1 })
        .filter(gridItem => gridItem !== entity.gridItem)
        .filter(gridItem => rectRectCollision(gridItem, entity.gridItem))
        .forEach(gridItem => {
          const d = dist(gridItem, entity.gridItem);
          if (d < 0 || d > ENTITY_SEPARATION) return;

          // Calculate vector pointing away from neighbor
          const diff = subVector(entity.gridItem, gridItem);

          entity.velocity = addVector(entity.velocity, setMagnitude(diff, d));
        });

      const newPos = addVector(
        { x: entity.gridItem.x, y: entity.gridItem.y },
        setMagnitude(entity.velocity, (entity.speed * dt) / 1000)
      );
      const cell = map.getCellAt(newPos);

      if (cell.height === 0) return;

      entity.gridItem.x = clamp(newPos.x, 0, map.width - 1);
      entity.gridItem.y = clamp(newPos.y, 0, map.height - 1);
      grid.update(entity.gridItem);
    });
  };
};
