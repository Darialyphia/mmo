import {
  MapCell,
  Point,
  Rectangle,
  pointRectCollision,
  randomInt,
  rectRectCollision
} from '@mmo/shared';
import { GameMap } from '../mapgen';
import { GameContext } from '../factories/context';
import { GameEntity, WithGridItem, WithMovement } from '../types';
import { isObstacle } from '../factories/obstacle';

export const findValidSpawnPosition = (map: GameMap, size = { w: 1, h: 1 }) => {
  let spawnPosition = {
    x: randomInt(map.width - 1),
    y: randomInt(map.height - 1)
  };
  let cell = map.getCellAt(spawnPosition);

  while (cell.height === 0) {
    spawnPosition = {
      x: randomInt(map.width),
      y: randomInt(map.height)
    };
    cell = map.getCellAt(spawnPosition);
  }

  return spawnPosition;
};

export const getCellKey = (cell: { position: Point }) =>
  `${cell.position.x}:${cell.position.y}`;

export const isCellWalkable = (
  cell: MapCell,
  { grid, entities }: GameContext
) => {
  if (cell.height === 0) return false;

  return !grid
    .findNearby(cell.position, { w: 1, h: 1 })
    .map(g => entities.getByIndex('gridItem', g))
    .some(e => e && isObstacle(e));
};

// Checks if a cell is walkable AND checks collision with entities present in that cell
export const isWalkable = (
  { gridItem }: WithGridItem,
  point: Point,
  { grid, map, entities }: GameContext
) => {
  const cell = map.getCellAt(point);
  if (cell.height === 0) return false;

  const nearby = grid
    .findNearby(point, { w: 1, h: 1 }, g =>
      isObstacle(entities.getByIndex('gridItem', g)!)
    )
    .map(g => entities.getByIndex('gridItem', g)!);

  return !nearby.some(e => {
    return rectRectCollision(
      {
        x: point.x - gridItem.w / 2,
        y: point.y - gridItem.h / 2,
        w: gridItem.w,
        h: gridItem.h
      },
      {
        x: e.gridItem.x - e.gridItem.w / 2,
        y: e.gridItem.y - e.gridItem.h / 2,
        w: e.gridItem.w,
        h: e.gridItem.h
      }
    );
  });
};
