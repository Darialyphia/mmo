import { MapCell, Point, randomInt } from '@mmo/shared';
import { GameMap } from '../mapgen';

export const findValidSpawnPosition = (map: GameMap, size = { w: 1, h: 1 }) => {
  let spawnPosition = {
    x: randomInt(map.width - 1),
    y: randomInt(map.height - 1)
  };
  let cells = map.getWithinBounds({
    min: { x: spawnPosition.x, y: spawnPosition.y },
    max: { x: spawnPosition.x + size.w, y: spawnPosition.y + size.h }
  });

  let isOk = cells.every(cell => cell.height !== 0);

  while (!isOk) {
    spawnPosition = {
      x: randomInt(map.width - 1),
      y: randomInt(map.height - 1)
    };
    cells = map.getWithinBounds({
      min: { x: spawnPosition.x, y: spawnPosition.y },
      max: { x: spawnPosition.x + size.w, y: spawnPosition.y + size.h }
    });

    isOk = cells.every(cell => cell.height !== 0);
  }

  return spawnPosition;
};

export const getCellKey = (cell: { position: Point }) =>
  `${cell.position.x}:${cell.position.y}`;

export const isCellWalkable = (cell: MapCell) => {
  return cell.height !== 0;
};
