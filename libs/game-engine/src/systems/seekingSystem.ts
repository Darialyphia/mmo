import {
  Boundaries,
  Nullable,
  Point,
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
  GameEntityId,
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

type Seekable = GameEntity & WithGridItem;

const isSeeker = (x: GameEntity): x is GameEntity & Seeker =>
  hasGridItem(x) && hasFieldOfView(x) && hasSeeking(x) && hasMovement(x);

const isSeekable = (x: GameEntity): x is GameEntity & Seekable =>
  hasGridItem(x);

const ASTAR_SCALE_FACTOR = 2;

export const createSeekingSystem = ({ entities, map, grid }: GameContext) => {
  const stopSeeking = (entity: Seeker) => {
    entity.seeking.target = null;
    entity.velocity = { x: 0, y: 0 };
    entity.path = undefined;
  };

  const findTarget = (seeker: Seeker): Nullable<GameEntityId> => {
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

    return seekable[0]?.id;
  };

  const getAstarRows = (seeker: Seeker) => {
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
        w: ASTAR_SCALE_FACTOR * (1 + (bounds.max.x - bounds.min.x)),
        h: ASTAR_SCALE_FACTOR * (1 + (bounds.max.y - bounds.min.y))
      },
      () => 1
    );

    for (let i = 0; i < ASTAR_SCALE_FACTOR; i++) {
      for (let j = 0; j < ASTAR_SCALE_FACTOR; j++) {
        cells.forEach(cell => {
          const y = ASTAR_SCALE_FACTOR * (cell.position.y - bounds.min.y) + i;
          const x = ASTAR_SCALE_FACTOR * (cell.position.x - bounds.min.x) + j;
          rows[y][x] = cell.height === 0 ? 1 : 0;
        });
      }
    }

    return { bounds, rows };
  };

  const scaleVecToBounds = (vec: Point, bounds: Boundaries<Point>) =>
    mulVector(subVector(vec, bounds.min), ASTAR_SCALE_FACTOR);

  const mapAstarPath = (path: number[][], bounds: Boundaries<Point>) =>
    path.map(([x, y]) =>
      addVector(
        { x: x / ASTAR_SCALE_FACTOR, y: y / ASTAR_SCALE_FACTOR },
        bounds.min
      )
    );

  const computeVelocity = (seeker: Seeker, target: Seekable) => {
    const { bounds, rows } = getAstarRows(seeker);

    const start = {
      x: Math.round(seeker.gridItem.x),
      y: Math.round(seeker.gridItem.y)
    };
    const goal = {
      x: Math.round(target.gridItem.x),
      y: Math.round(target.gridItem.y)
    };
    try {
      const path = new AStarFinder({
        grid: {
          matrix: rows
        },
        diagonalAllowed: true,
        includeStartNode: false,
        includeEndNode: true,
        weight: 1
      }).findPath(
        scaleVecToBounds(start, bounds),
        scaleVecToBounds(goal, bounds)
      );

      seeker.path = mapAstarPath(path, bounds);

      if (!path.length) return { x: 0, y: 0 };

      const force = addVector(
        seeker.velocity,
        subVector(
          addVector(
            {
              x: path[0][0] / ASTAR_SCALE_FACTOR,
              y: path[0][1] / ASTAR_SCALE_FACTOR
            },
            bounds.min
          ),
          seeker.gridItem
        )
      );
      return setMagnitude(force, 1);
    } catch {
      console.log(`pathfinding error for entity ${seeker.id}, skipping.`);
      return seeker.velocity;
    }
  };

  return () => {
    entities.getList().forEach(entity => {
      if (!isSeeker(entity)) return;
      if (!entity.seeking.target) {
        entity.seeking.target = findTarget(entity);
      }

      const target = entities.getByIndex('id', entity.seeking.target);
      if (!target) {
        return stopSeeking(entity);
      }

      const canSeek = isSeekable(target) && entity.seeking.canSeek(target);
      if (!canSeek) {
        return stopSeeking(entity);
      }

      const isOutOfReach = dist(entity.gridItem, target.gridItem) > entity.fov;
      if (isOutOfReach) {
        return stopSeeking(entity);
      }

      entity.velocity = computeVelocity(entity, target);
    });
  };
};
