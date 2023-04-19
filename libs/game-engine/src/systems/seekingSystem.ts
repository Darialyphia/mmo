import {
  addVector,
  createMatrix,
  dist,
  isDefined,
  mulVector,
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
import { AStarFinder } from 'astar-typescript';

type Seeker = GameEntity &
  WithGridItem &
  WithFieldOfView &
  WithSeeking &
  WithMovement;
const isSeeker = (x: GameEntity): x is GameEntity & Seeker =>
  hasGridItem(x) && hasFieldOfView(x) && hasSeeking(x) && hasMovement(x);

const SCALE_FACTOR = 2;

export const createSeekingSystem = ({ entities, map, grid }: GameContext) => {
  const stopSeeking = (entity: Seeker) => {
    entity.seeking.target = null;
    entity.velocity = { x: 0, y: 0 };
  };

  const findTarget = (seeker: Seeker) => {
    const seekable = grid
      .findNearbyRadius(
        { x: seeker.gridItem.x, y: seeker.gridItem.y },
        seeker.fov
      )
      .map(gridItem => entities.getByIndex('gridItem', gridItem))
      .filter(isDefined)
      .filter(entity => entity && seeker.seeking.canSeek(entity))
      .sort(
        (a, b) =>
          dist(b.gridItem, seeker.gridItem) - dist(a.gridItem, seeker.gridItem)
      );

    return seekable[0];
  };

  const computeVelocity = (seeker: Seeker) => {
    if (!seeker.seeking.target) return seeker.velocity;
    const { target } = seeker.seeking;

    const cells = map.getFieldOfView(seeker.gridItem, seeker.fov);
    const xPositions = cells.map(c => c.position.x);
    const yPositions = cells.map(c => c.position.y);
    const bounds = {
      min: {
        x: Math.min(...xPositions),
        y: Math.min(...yPositions)
      },
      max: {
        x: Math.max(...xPositions),
        y: Math.max(...yPositions)
      }
    };

    const rows = createMatrix<number>(
      {
        w: SCALE_FACTOR * (1 + (bounds.max.x - bounds.min.x)),
        h: SCALE_FACTOR * (1 + (bounds.max.y - bounds.min.y))
      },
      () => 1
    );

    for (let i = 0; i < SCALE_FACTOR; i++) {
      for (let j = 0; j < SCALE_FACTOR; j++) {
        cells.forEach(cell => {
          const y = SCALE_FACTOR * (cell.position.y - bounds.min.y) + i;
          const x = SCALE_FACTOR * (cell.position.x - bounds.min.x) + j;
          rows[y][x] = cell.height === 0 ? 1 : 0;
        });
      }
    }

    const start = mulVector(
      subVector(
        {
          x: Math.round(seeker.gridItem.x),
          y: Math.round(seeker.gridItem.y)
        },
        bounds.min
      ),
      SCALE_FACTOR
    );
    const goal = mulVector(
      subVector(
        {
          x: Math.round(target.gridItem.x),
          y: Math.round(target.gridItem.y)
        },
        bounds.min
      ),
      SCALE_FACTOR
    );
    try {
      const path = new AStarFinder({
        grid: {
          matrix: rows
        },
        diagonalAllowed: true,
        includeStartNode: false,
        includeEndNode: true,
        weight: 1
      }).findPath(start, goal);

      seeker.path = path.map(([x, y]) =>
        addVector({ x: x / SCALE_FACTOR, y: y / SCALE_FACTOR }, bounds.min)
      );

      if (!path.length) return { x: 0, y: 0 };
      const targetVec = addVector(
        { x: path[0][0] / SCALE_FACTOR, y: path[0][1] / SCALE_FACTOR },
        bounds.min
      );

      return setMagnitude(
        addVector(seeker.velocity, subVector(targetVec, seeker.gridItem)),
        1
      );
    } catch {
      return seeker.velocity;
    }
  };

  return () => {
    entities.getList().forEach(entity => {
      if (!isSeeker(entity)) return;
      if (!entity.seeking.target) {
        entity.seeking.target = findTarget(entity);
      }

      if (
        !entity.seeking.target ||
        !entities.has('id', entity.seeking.target.id)
      ) {
        return stopSeeking(entity);
      }

      const isOutOfReach =
        dist(entity.gridItem, entity.seeking.target.gridItem) > entity.fov;
      const isSeekable = entity.seeking.canSeek(entity.seeking.target as any);

      if (isOutOfReach || !isSeekable) {
        return stopSeeking(entity);
      }

      entity.velocity = computeVelocity(entity);
    });
  };
};
