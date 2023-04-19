import {
  addVector,
  clamp,
  dist,
  isDefined,
  randomInt,
  setMagnitude,
  subVector
} from '@mmo/shared';
import { GameContext } from '../factories/context';
import {
  GameEntity,
  WithFieldOfView,
  WithGridItem,
  WithMovement,
  WithSeeking,
  hasFieldOfView,
  hasGridItem,
  hasMovement,
  hasSeeking
} from '../types';

type Seeker = GameEntity &
  WithGridItem &
  WithFieldOfView &
  WithSeeking &
  WithMovement;
const isSeeker = (x: GameEntity): x is GameEntity & Seeker =>
  hasGridItem(x) && hasFieldOfView(x) && hasSeeking(x) && hasMovement(x);

export const createSeekingSystem = ({ entities, map, grid }: GameContext) => {
  const stopSeeking = (entity: WithSeeking & WithMovement) => {
    entity.seeking.target = null;
    entity.velocity = { x: 0, y: 0 };
  };

  const findTarget = (seeker: Seeker) => {
    const seekableEntities = grid
      .findNearbyRadius(
        { x: seeker.gridItem.x, y: seeker.gridItem.y },
        seeker.fov
      )
      .map(gridItem => entities.getByIndex('gridItem', gridItem))
      .filter(isDefined)
      .filter(entity => seeker.seeking.canSeek(entity))
      .sort(
        (a, b) =>
          dist(b.gridItem, seeker.gridItem) - dist(a.gridItem, seeker.gridItem)
      );
    return seekableEntities[0];
  };

  return () => {
    entities.getList().forEach(entity => {
      if (!isSeeker(entity)) return;

      if (!entity.seeking.target) {
        entity.seeking.target = findTarget(entity);
      }

      if (!entity.seeking.target) return;
      const isOutOfReach =
        dist(entity.gridItem, entity.seeking.target.gridItem) > entity.fov;
      const isNotSeekable = !entity.seeking.canSeek(
        entity.seeking.target as any
      );

      if (isOutOfReach || isNotSeekable) {
        return stopSeeking(entity);
      }

      entity.velocity = subVector(
        entity.seeking.target.gridItem,
        entity.gridItem
      );
    });
  };
};
