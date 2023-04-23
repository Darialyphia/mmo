import {
  Entity,
  MapCell,
  createIndexedArray,
  createSpatialHashGrid,
  isDefined
} from '@mmo/shared';
import { createMap } from '../mapgen';
import { Player, isPlayer } from './player';
import { SPATIAL_GRID_DIMENSIONS } from '../constants';
import { hasFieldOfView, hasGridItem, hasOrientation } from '../types';
import { Monster } from './monster';
import { Obstacle } from './obstacle';

export type GameContext = ReturnType<typeof createContext>;

export type GameStateSnapshot = {
  fieldOfView: Record<string, { cells: MapCell[]; entities: Entity[] }>;
};

export type AnyEntity = Player | Monster | Obstacle;

export const createContext = () => {
  const map = createMap();
  const entities = createIndexedArray<AnyEntity>([])
    .addIndex('id', e => e.id)
    .addIndex('gridItem', e => e.gridItem)
    .addGroup('brand', e => e.__brand);
  const grid = createSpatialHashGrid({
    dimensions: { w: SPATIAL_GRID_DIMENSIONS, h: SPATIAL_GRID_DIMENSIONS },
    bounds: {
      start: { x: 0, y: 0 },
      end: { x: map.width, y: map.height }
    }
  });

  const featureFlags = {
    seeking: true,
    movement: true,
    monsterSpawning: false
  } as const;

  return { map, entities, grid, featureFlags };
};

export const getSnapshot = (
  context: GameContext,
  getPlayers: () => Player[]
): GameStateSnapshot => {
  const entries = context.entities
    .getList()
    .filter(isPlayer)
    .map(entity => {
      const entities: Entity[] = context.grid
        .findNearbyRadius(
          { x: entity.gridItem.x, y: entity.gridItem.y },
          entity.fov
        )
        .map(gridItem => {
          const entity = context.entities.getByIndex('gridItem', gridItem)!;
          if (!hasGridItem(entity) || !hasOrientation(entity)) return;

          return {
            id: entity.id,
            brand: entity.__brand,
            spriteId: entity.spriteId,
            orientation: entity.orientation,
            fov: hasFieldOfView(entity) ? entity.fov : 0,
            path: entity.path,
            position: { x: entity.gridItem.x, y: entity.gridItem.y },
            size: { w: entity.gridItem.w, h: entity.gridItem.h }
          };
        })
        .filter(isDefined);
      const cells = context.map.getFieldOfView(entity.gridItem, entity.fov + 1);

      return [entity.id, { entities, cells }];
    });

  return { fieldOfView: Object.fromEntries(entries) };
};
