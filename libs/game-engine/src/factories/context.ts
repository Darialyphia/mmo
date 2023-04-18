import {
  Entity,
  GridItem,
  MapCell,
  SpatialHashGrid,
  createSpatialHashGrid
} from '@mmo/shared';
import { GameMap, createMap } from '../mapgen';
import { GamePlayer } from './player';
import { PLAYER_FOV } from '../constants';

export type GameContext = {
  map: GameMap;
  entities: GamePlayer[];
  entitiesLookup: Map<string, GamePlayer>;
  grid: SpatialHashGrid;
  gridLookup: WeakMap<GridItem, GamePlayer>;
};

export type GameStateSnapshot = {
  fieldOfView: Record<string, { cells: MapCell[]; entities: Entity[] }>;
};

export const createContext = () => {
  const map = createMap();
  const entities: GamePlayer[] = [];
  const entitiesLookup = new Map<string, GamePlayer>();
  const grid = createSpatialHashGrid({
    dimensions: { w: map.width, h: map.height },
    bounds: {
      start: { x: 0, y: 0 },
      end: { x: map.width, y: map.height }
    }
  });
  const gridLookup = new WeakMap<GridItem, GamePlayer>();

  return { map, entities, entitiesLookup, grid, gridLookup };
};

export const getSnapshot = (context: GameContext): GameStateSnapshot => {
  const fieldOfView = Object.fromEntries(
    context.entities.map(entity => {
      const entities = context.grid
        .findNearbyRadius(
          { x: entity.gridItem.x, y: entity.gridItem.y },
          PLAYER_FOV
        )
        .map(gridItem => {
          const player = context.gridLookup.get(gridItem)!;
          return {
            id: player.id,
            character: player.character,
            orientation: player.orientation,
            position: { x: player.gridItem.x, y: player.gridItem.y }
          };
        });
      const cells = context.map.getFieldOfView(entity.gridItem, PLAYER_FOV);

      return [entity.id, { entities, cells }];
    })
  );

  return { fieldOfView };
};
