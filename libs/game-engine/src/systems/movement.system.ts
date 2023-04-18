import { addVector, clamp } from '@mmo/shared';
import { GameContext } from '../factories/context';

export const createMovementSystem = ({ entities, map, grid }: GameContext) => {
  return () => {
    entities.forEach(entity => {
      const newPos = addVector(
        { x: entity.gridItem.x, y: entity.gridItem.y },
        entity.velocity
      );

      const cell = map.getCellAt(newPos);
      if (cell.height === 0) return;

      entity.gridItem.x = clamp(newPos.x, 0, grid.dimensions.w - 1);
      entity.gridItem.y = clamp(newPos.y, 0, grid.dimensions.h - 1);
      grid.update(entity.gridItem);
    });
  };
};
