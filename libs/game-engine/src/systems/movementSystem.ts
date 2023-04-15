import {
  setMagnitude,
  type Point,
  type SpatialHashGrid,
  addVector,
  clamp
} from '@mmo/shared';
import type { GameMap } from '../mapgen';
import type { Directions, GamePlayer } from '../game';
import { PLAYER_SPEED } from '../constants';

const computeVelocity = (directions: Directions, speed: number): Point => {
  const vel = { x: 0, y: 0 };
  if (directions.right) {
    vel.x += 1;
  }
  if (directions.left) {
    vel.x -= 1;
  }
  if (directions.up) {
    vel.y -= 1;
  }
  if (directions.down) {
    vel.y += 1;
  }
  return setMagnitude(vel, speed);
};

export const createMovementSystem = (map: GameMap, grid: SpatialHashGrid) => {
  return (players: GamePlayer[]) => {
    players.forEach(player => {
      const velocity = computeVelocity(player.directions, PLAYER_SPEED);
      const newPos = addVector(
        { x: player.gridItem.x, y: player.gridItem.y },
        velocity
      );

      const cell = map.getCellAt(newPos);
      if (cell.height === 0) return;
      player.gridItem.x = clamp(newPos.x, 0, grid.dimensions.w - 1);
      player.gridItem.y = clamp(newPos.y, 0, grid.dimensions.h - 1);
    });
  };
};
