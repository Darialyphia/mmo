import {
  Boundaries,
  MapCell,
  Nullable,
  Point,
  addVector,
  createMatrix,
  dist,
  rectRectCollision,
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
import { bBoxToRect, getEntitiesInFieldOfView, isBox } from '../utils/entity';

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
    const seekerRect = bBoxToRect(seeker.box);

    const obstacles = world
      .search({
        minX: seekerRect.x - seeker.fov,
        minY: seekerRect.y - seeker.fov,
        maxX: seekerRect.x + seeker.fov,
        maxY: seekerRect.y + seeker.fov
      })
      .filter(body => {
        const entity = entities.getByIndex('box', body);
        if (!entity) return true;
        return isObstacle(entity);
      });

    const bounds = {
      min: {
        x: Math.floor(seekerRect.x - seeker.fov),
        y: Math.floor(seekerRect.y - seeker.fov)
      },
      max: {
        x: Math.ceil(seekerRect.x + seeker.fov),
        y: Math.ceil(seekerRect.y + seeker.fov)
      }
    };

    const rows = createMatrix<number>(
      {
        w: 1 + (bounds.max.x - bounds.min.x),
        h: 1 + (bounds.max.y - bounds.min.y)
      },
      () => 0
    );

    obstacles.forEach(body => {
      if (!isBox(body)) return;
      const rect = bBoxToRect(body);
      for (let x = Math.floor(rect.x); x <= Math.ceil(rect.x + rect.w); x++) {
        for (let y = Math.floor(rect.y); y <= Math.ceil(rect.y + rect.h); y++) {
          if (
            x < bounds.min.x ||
            x > bounds.max.x ||
            y < bounds.min.y ||
            y > bounds.max.y
          ) {
            continue;
          }
          const isColliding = rectRectCollision(rect, {
            x: x,
            y: y,
            w: seekerRect.w,
            h: seekerRect.h
          });
          if (isColliding) {
            rows[y - bounds.min.y][x - bounds.min.x] = 1;
          }
        }
      }
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
