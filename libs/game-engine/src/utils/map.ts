import { MapCell, Point, randomInt } from '@mmo/shared';
import { GameMap } from '../mapgen';

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
