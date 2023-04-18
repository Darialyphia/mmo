import { addVector, clamp, setMagnitude } from '@mmo/shared';
import { GameContext } from '../factories/context';
import { hasGridItem, hasVelocity } from '../types';
import { PLAYER_SPEED } from '../constants';

export const createMovementSystem = ({ entities, map, grid }: GameContext) => {
  return (dt: number) => {
    entities.forEach(entity => {
      if (!hasGridItem(entity) || !hasVelocity(entity)) return;

      const newPos = addVector(
        { x: entity.gridItem.x, y: entity.gridItem.y },
        setMagnitude(entity.velocity, (PLAYER_SPEED * dt) / 1000)
      );

      // const cell = map.getCellAt(newPos);
      // if (cell.height === 0) return;

      entity.gridItem.x = clamp(newPos.x, 0, map.width - 1);
      entity.gridItem.y = clamp(newPos.y, 0, map.height - 1);
      grid.update(entity.gridItem);
    });
  };
};
