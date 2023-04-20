import { MapCell, Point, randomInt } from '@mmo/shared';
import { GameMap } from '../mapgen';
import { GameContext } from '../factories/context';
import { isObstacle } from '../factories/obstacle';

export const findValidSpawnPosition = (map: GameMap) => {
  let spawnPosition = {
    x: randomInt(map.width),
    y: randomInt(map.height)
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

export const isWalkable = (cell: MapCell, { grid, entities }: GameContext) => {
  if (cell.height === 0) return false;

  return !grid
    .findNearby(cell.position, { w: 1, h: 1 })
    .map(g => entities.getByIndex('gridItem', g))
    .some(e => e && isObstacle(e));
};
