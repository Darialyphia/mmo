import {
  Boundaries,
  MapCell,
  Nullable,
  Point,
  addVector,
  createMatrix,
  dist,
  setMagnitude,
  subVector
} from '@mmo/shared';
import { GameContext } from '../factories/context';
import {
  GameEntity,
  GameEntityId,
  WithFieldOfView,
  WithPosition,
  WithMovement,
  WithSeeking,
  hasFieldOfView,
  hasPosition,
  hasMovement,
  hasSeeking,
  hasSleep
} from '../types';
import { AStarFinder } from 'astar-typescript';
import { isObstacle } from '../factories/obstacle';
import { bBoxToRect, getEntitiesInFieldOfView } from '../utils/entity';

type Seeker = GameEntity &
  WithPosition &
  WithFieldOfView &
  WithSeeking &
  WithMovement;

type Seekable = GameEntity & WithPosition;

const isSeeker = (x: GameEntity): x is GameEntity & Seeker =>
  hasPosition(x) && hasFieldOfView(x) && hasSeeking(x) && hasMovement(x);

const isSeekable = (x: GameEntity): x is GameEntity & Seekable =>
  hasPosition(x);

export const createSeekingSystem = (ctx: GameContext) => {
  const { entities, map, world } = ctx;
  const stopSeeking = (entity: Seeker) => {
    entity.seeking.target = null;
    entity.velocity = { x: 0, y: 0 };
    entity.path = undefined;
  };

  const findTarget = (seeker: Seeker): Nullable<GameEntityId> => {
    const seekerRect = bBoxToRect(seeker.box);
    const seekable = getEntitiesInFieldOfView(seeker, ctx)
      .filter(
        candidate => isSeekable(candidate) && seeker.seeking.canSeek(candidate)
      )
      .sort((a, b) => {
        const aRect = bBoxToRect(a.box);
        const bRect = bBoxToRect(b.box);
        return dist(bRect, seekerRect) - dist(aRect, seekerRect);
      });

    return seekable[0]?.id;
  };

  const getAstarRows = (seeker: Seeker) => {
    const cells = map.getFieldOfView(bBoxToRect(seeker.box), seeker.fov);
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
        w: 1 + (bounds.max.x - bounds.min.x),
        h: 1 + (bounds.max.y - bounds.min.y)
      },
      () => 0
    );

    cells.forEach(cell => {
      const y = cell.position.y - bounds.min.y;
      const x = cell.position.x - bounds.min.x;

      const hasObstacle = world
        .search({
          minX: cell.position.x - 1,
          minY: cell.position.y - 1,
          maxX: cell.position.x,
          maxY: cell.position.y
        })
        .some(body => {
          const entity = entities.getByIndex('box', body);
          if (!entity) return true;
          return isObstacle(entity);
        });

      rows[y][x] = hasObstacle ? 1 : 0;
    });

    return { bounds, rows };
  };

  const scaleVecToBounds = (vec: Point, bounds: Boundaries<Point>) =>
    subVector(vec, bounds.min);

  const mapAstarPath = (path: number[][], bounds: Boundaries<Point>) =>
    path.map(([x, y]) => addVector({ x, y }, bounds.min));

  const computeVelocity = (seeker: Seeker) => {
    const target = entities.getByIndex('id', seeker.seeking.target);
    if (!target) return seeker.velocity;

    const { bounds, rows } = getAstarRows(seeker);
    const seekerRect = bBoxToRect(seeker.box);
    const targetRect = bBoxToRect(target.box);
    const start = scaleVecToBounds(
      {
        x: Math.round(seekerRect.x),
        y: Math.round(seekerRect.y)
      },
      bounds
    );
    const goal = scaleVecToBounds(
      {
        x: Math.round(targetRect.x),
        y: Math.round(targetRect.y)
      },
      bounds
    );

    try {
      rows[start.y][start.x] = 0;
      rows[goal.y][goal.x] = 0;
      const path = new AStarFinder({
        grid: {
          matrix: rows
        },
        diagonalAllowed: true,
        includeStartNode: false,
        includeEndNode: true,
        weight: 0.7
      }).findPath(start, goal);
      seeker.path = mapAstarPath(path, bounds);
      if (!path.length) return { x: 0, y: 0 };
      const [nextStep] = path;

      return setMagnitude(
        addVector(
          seeker.velocity,
          subVector(
            addVector(
              {
                x: nextStep[0],
                y: nextStep[1]
              },
              bounds.min
            ),
            seekerRect
          )
        ),
        1
      );
    } catch {
      console.log('pathing error');
      return seeker.velocity;
    }
  };

  const getSeekers = entities.createFilter<Seeker>(isSeeker);

  return () => {
    if (!ctx.featureFlags.seeking) return;

    getSeekers().forEach(entity => {
      if (!isSeeker(entity)) return;
      if (hasSleep(entity) && entity.sleep.isAsleep) {
        return;
      }

      if (!entity.seeking.target) {
        entity.seeking.target = findTarget(entity);
      } else {
        const target = entities.getByIndex('id', entity.seeking.target);

        if (!target) {
          return stopSeeking(entity);
        }

        const canSeek = isSeekable(target) && entity.seeking.canSeek(target);
        if (!canSeek) {
          return stopSeeking(entity);
        }

        const rect = bBoxToRect(entity.box);
        const targetRect = bBoxToRect(target.box);
        const isOutOfReach = dist(rect, targetRect) > entity.fov;
        if (isOutOfReach) {
          return stopSeeking(entity);
        }
      }

      entity.velocity = computeVelocity(entity);
    });
  };
};
