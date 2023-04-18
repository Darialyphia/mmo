import {
  Entity,
  GridItem,
  MapCell,
  SpatialHashGrid,
  createSpatialHashGrid,
  isDefined
} from '@mmo/shared';
import { GameMap, createMap } from '../mapgen';
import { Player, isPlayer } from './player';
import { PLAYER_FOV } from '../constants';
import { GameEntity, hasGridItem, hasOrientation } from '../types';

export type GameContext = {
  map: GameMap;
  entities: GameEntity[];
  entitiesLookup: Map<string, GameEntity>;
  grid: SpatialHashGrid;
  gridLookup: WeakMap<GridItem, GameEntity>;
};

export type GameStateSnapshot = {
  fieldOfView: Record<string, { cells: MapCell[]; entities: Entity[] }>;
};

export const createContext = () => {
  const map = createMap();
  const entities: Player[] = [];
  const entitiesLookup = new Map<string, Player>();
  const grid = createSpatialHashGrid({
    dimensions: { w: map.width / 10, h: map.height / 10 },
    bounds: {
      start: { x: 0, y: 0 },
      end: { x: map.width, y: map.height }
    }
  });
  const gridLookup = new WeakMap<GridItem, Player>();

  return { map, entities, entitiesLookup, grid, gridLookup };
};

export const getSnapshot = (context: GameContext): GameStateSnapshot => {
  const players = context.entities.filter(isPlayer);
  const p = performance.now();
  const entries = players.map(entity => {
    const entities = context.grid
      .findNearbyRadius(
        { x: entity.gridItem.x, y: entity.gridItem.y },
        PLAYER_FOV
      )
      .map(gridItem => {
        const entity = context.gridLookup.get(gridItem)!;
        if (!hasGridItem(entity) || !hasOrientation(entity)) return;

        return {
          id: entity.id,
          spriteId: entity.spriteId,
          orientation: entity.orientation,
          position: { x: entity.gridItem.x, y: entity.gridItem.y }
        };
      })
      .filter(isDefined);
    const cells = context.map.getFieldOfView(entity.gridItem, PLAYER_FOV);

    return [entity.id, { entities, cells }];
  });

  return { fieldOfView: Object.fromEntries(entries) };
};
