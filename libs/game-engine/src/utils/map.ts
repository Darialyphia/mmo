import { MapCell, Point, randomInt } from '@mmo/shared';
import { GameMap } from '../mapgen';

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

export const isCellWalkable = (cell: MapCell) => {
  return cell.height !== 0;
};
