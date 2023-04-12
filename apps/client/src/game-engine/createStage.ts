import * as PIXI from 'pixi.js';
import {
  MapCellEdge,
  randomInt,
  type MapLayout,
  type Rectangle,
  type Point,
  clamp
} from '@mmo/shared';
import { createTileset } from './createTileset';
import { spritePaths } from './sprites';
import { CELL_SIZE } from './constants';
import type { Camera } from './createCamera';
import { debounce } from 'lodash-es';

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

const variantsCache = new Map<string, number>();

type CreateStageOptions = {
  app: PIXI.Application;
  camera: Camera;
  gameWorld: { map: MapLayout };
};
export const createStage = async ({
  app,
  camera,
  gameWorld
}: CreateStageOptions) => {
  const mapContainer = new PIXI.Container();
  const backdrop = new PIXI.Graphics();
  backdrop.beginFill(0x000000);
  backdrop.drawRect(
    0,
    0,
    gameWorld.map.width * CELL_SIZE,
    gameWorld.map.height * CELL_SIZE
  );
  backdrop.endFill();
  mapContainer.addChild(backdrop);
  let currentChunkContainer = new PIXI.Container();
  mapContainer.addChild(currentChunkContainer);

  // const CHUNK_BUFFER = Math.ceil(
  //   Math.max(app.screen.width, app.screen.height) / CELL_SIZE
  // );
  const CHUNK_BUFFER = 15;
  const chunkSize = {
    w: Math.ceil(
      app.screen.width / CELL_SIZE / camera.container.scale.x + CHUNK_BUFFER
    ),
    h: Math.ceil(
      app.screen.height / CELL_SIZE / camera.container.scale.y + CHUNK_BUFFER
    )
  };

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

  const currentChunk: Rectangle = {
    x: 0,
    y: 0,
    w: chunkSize.w,
    h: chunkSize.h
  };

  app.ticker.add(() => {
    const center = camera.container.pivot.clone();
    const cameraPosition = {
      x: Math.floor(center.x / CELL_SIZE),
      y: Math.floor(center.y / CELL_SIZE)
    };

    const isCloseToChunkEdge =
      cameraPosition.x - currentChunk.x < CHUNK_BUFFER ||
      currentChunk.x + currentChunk.w - cameraPosition.x < CHUNK_BUFFER ||
      cameraPosition.y - currentChunk.y < CHUNK_BUFFER ||
      currentChunk.y + currentChunk.h - cameraPosition.y < CHUNK_BUFFER;

    if (isCloseToChunkEdge) {
      drawChunk(cameraPosition);
    }
  });

  const drawChunk = debounce((center: Point) => {
    Object.assign(currentChunk, {
      x: clamp(center.x - Math.floor(chunkSize.w / 2), 0, Infinity),
      y: clamp(center.y - Math.floor(chunkSize.h / 2), 0, Infinity)
    });

    currentChunkContainer.destroy();
    currentChunkContainer = new PIXI.Container();
    mapContainer.addChild(currentChunkContainer);

    gameWorld.map.cells.forEach((cell, cellIndex) => {
      const x = cellIndex % mapOptions.dimensions.w;
      const y = cellIndex / mapOptions.dimensions.h;
      if (
        x < currentChunk.x ||
        x > currentChunk.x + currentChunk.w ||
        y < currentChunk.y ||
        y > currentChunk.y + currentChunk.h
      ) {
        return;
      }

      const tileContainer = new PIXI.Container();

      const variant =
        variantsCache.get([x, y].toString()) ??
        randomInt(VARIANTS_BY_EDGES[cell.edge] - 1);
      variantsCache.set([x, y].toString(), variant);

      const tileIndex =
        (cell.terrain * MAX_TILES_PER_TERRAIN + cell.edge) * MAX_VARIANTS +
        variant;

      const sprite = new PIXI.Sprite(
        sheet.textures[`${tilesetOptions.id}-${tileIndex}`]
      );

      tileContainer.position.set(
        mapOptions.tileSize * x,
        mapOptions.tileSize * y
      );
      tileContainer.scale.set(1.01, 1.01); //remves rendering artifact, not sure wy they're here in the first place
      sprite.anchor.set(0.5, 0.5);
      sprite.angle = cell.angle;
      sprite.cullable = true;

      currentChunkContainer.addChild(tileContainer);

      tileContainer.addChild(sprite);
    });
  }, 16);

  return mapContainer;
};
