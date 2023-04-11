import * as PIXI from 'pixi.js';
import { MapCellEdge, randomInt, type MapLayout } from '@mmo/shared';
import { createTileset } from './createTileset';
import { spritePaths } from './sprites';
import { CELL_SIZE } from './constants';

const VARIANTS_BY_EDGES = {
  [MapCellEdge.NONE]: 4,
  [MapCellEdge.ONE_SIDE]: 1,
  [MapCellEdge.TWO_SIDES]: 1,
  [MapCellEdge.THREE_SIDES]: 1,
  [MapCellEdge.ALL_SIDES]: 1,
  [MapCellEdge.CORNER]: 1
} as const;
const MAX_VARIANTS = Math.max(...Object.values(VARIANTS_BY_EDGES));

const MAX_TILES_PER_TERRAIN = 6;
const TERRAINS_COUNT = 4;
export const createStage = async (gameWorld: { map: MapLayout }) => {
  const mapContainer = new PIXI.Container();

  const tilesetOptions = {
    path: spritePaths.tileSets.base,
    id: 'baseTileset',
    dimensions: {
      w: CELL_SIZE * MAX_VARIANTS,
      h: CELL_SIZE * TERRAINS_COUNT * MAX_TILES_PER_TERRAIN
    },
    tileSize: CELL_SIZE
  };

  const mapOptions = {
    dimensions: { w: gameWorld.map.width, h: gameWorld.map.height },
    tileSize: CELL_SIZE
  };

  const sheet = await createTileset(tilesetOptions);

  gameWorld.map.cells.forEach((cell, cellIndex) => {
    const tileContainer = new PIXI.Container();

    const variant = randomInt(VARIANTS_BY_EDGES[cell.edge] - 1);
    const tileIndex =
      (cell.terrain * MAX_TILES_PER_TERRAIN + cell.edge) * MAX_VARIANTS +
      variant;

    const sprite = new PIXI.Sprite(
      sheet.textures[`${tilesetOptions.id}-${tileIndex}`]
    );

    tileContainer.position.set(
      mapOptions.tileSize * (cellIndex % mapOptions.dimensions.w) - 0.02,
      mapOptions.tileSize * Math.floor(cellIndex / mapOptions.dimensions.h) -
        0.02
    );
    sprite.anchor.set(0.5, 0.5);
    sprite.angle = cell.angle;
    sprite.cullable = true;

    mapContainer.addChild(tileContainer);

    tileContainer.addChild(sprite);
  });

  return mapContainer;
};
