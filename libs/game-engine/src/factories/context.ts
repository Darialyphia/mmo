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
import { hasFieldOfView, hasPosition, hasOrientation } from '../types';
import { Monster } from './monster';
import { Obstacle } from './obstacle';
import { System } from 'detect-collisions';
import { bBoxToRect, getEntitiesInFieldOfView } from '../utils/entity';

export type GameContext = ReturnType<typeof createContext>;

export type GameStateSnapshot = {
  fieldOfView: Record<string, { cells: MapCell[]; entities: Entity[] }>;
};

export type AnyEntity = Player | Monster | Obstacle;

export const createContext = () => {
  const world = new System();
  const map = createMap({ world });
  const entities = createIndexedArray<AnyEntity>([])
    .addIndex('id', e => e.id)
    .addIndex('box', e => e.box)
    .addGroup('brand', e => e.__brand);

  const featureFlags = {
    seeking: true,
    movement: true,
    monsterSpawning: false
  } as const;

  return { map, entities, world, featureFlags };
};

export const getSnapshot = (
  context: GameContext,
  getPlayers: () => Player[]
): GameStateSnapshot => {
  const entries = context.entities
    .getList()
    .filter(isPlayer)
    .map(player => {
      const rect = bBoxToRect(player.box);
      const entities: Entity[] = getEntitiesInFieldOfView(player, context)
        .map(entity => {
          if (!hasPosition(entity) || !hasOrientation(entity)) return;
          const { x, y, w, h } = bBoxToRect(entity.box);
          return {
            id: entity.id,
            brand: entity.__brand,
            spriteId: entity.spriteId,
            orientation: entity.orientation,
            fov: hasFieldOfView(entity) ? entity.fov : 0,
            path: entity.path,
            position: { x, y },
            size: { w, h }
          };
        })
        .filter(isDefined);
      const cells = context.map.getFieldOfView(rect, player.fov);
      return [player.id, { entities, cells }];
    });

  return { fieldOfView: Object.fromEntries(entries) };
};
