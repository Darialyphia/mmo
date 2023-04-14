import * as PIXI from 'pixi.js';
import {
  MapCellEdge,
  randomInt,
  type MapLayout,
  type Rectangle,
  type Point,
  clamp,
  type GameMeta,
  type MapCell,
  type GameStateSnapshotDto
} from '@mmo/shared';
import { createTileset } from './createTileset';
import { spritePaths } from './sprites';
import { CELL_SIZE } from './constants';
import type { Camera } from './createCamera';

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

type CreateMapOptions = {
  app: PIXI.Application;
  camera: Camera;
  meta: GameMeta;
};
const getCellKey = (cell: MapCell) => `${cell.position.x}:${cell.position.y}`;

export const createMap = async ({ app, camera, meta }: CreateMapOptions) => {
  const cells: MapCell[] = [];
  const cellKeys: Record<string, true> = {};

  const mapContainer = new PIXI.Container();
  // We need a backdrop the size of the whole map for the map container dimension to be set
  const backdrop = new PIXI.Graphics();
  backdrop.beginFill(0x000000, 0.01);
  backdrop.drawRect(0, 0, meta.width * CELL_SIZE, meta.height * CELL_SIZE);
  backdrop.endFill();

  mapContainer.addChild(backdrop);

  let currentChunkContainer = new PIXI.Container();
  mapContainer.addChild(currentChunkContainer);

  // const CHUNK_BUFFER = Math.ceil(
  //   Math.max(app.screen.width, app.screen.height) / CELL_SIZE
  // );
  const CHUNK_BUFFER_X =
    app.screen.width / 2 / CELL_SIZE / camera.container.scale.x;
  const CHUNK_BUFFER_Y =
    app.screen.height / 2 / CELL_SIZE / camera.container.scale.x;

  const chunkSize = {
    w: Math.ceil(
      (app.screen.width / CELL_SIZE / camera.container.scale.x) * 1.5
    ),
    h: Math.ceil(
      (app.screen.height / CELL_SIZE / camera.container.scale.y) * 1.5
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
    dimensions: { w: meta.width, h: meta.height },
    tileSize: CELL_SIZE
  };

  const sheet = await createTileset(tilesetOptions);

  const currentChunk: Rectangle = {
    x: 0,
    y: 0,
    w: chunkSize.w,
    h: chunkSize.h
  };

  const getCameraPosition = () => {
    const center = camera.container.pivot;
    return {
      x: Math.floor(center.x / CELL_SIZE),
      y: Math.floor(center.y / CELL_SIZE)
    };
  };

  app.ticker.add(() => {
    const cameraPosition = getCameraPosition();

    const left = cameraPosition.x - currentChunk.x < CHUNK_BUFFER_X;
    const right =
      currentChunk.x + currentChunk.w - cameraPosition.x < CHUNK_BUFFER_X;
    const top = cameraPosition.y - currentChunk.y < CHUNK_BUFFER_Y;
    const bottom =
      currentChunk.y + currentChunk.h - cameraPosition.y < CHUNK_BUFFER_Y;

    const isCloseToChunkEdge = left || right || top || bottom;

    if (isCloseToChunkEdge) {
      drawChunk(cameraPosition);
    }
  });

  const drawChunk = (center: Point, force?: boolean) => {
    const newChunk = {
      x: clamp(center.x - Math.floor(chunkSize.w / 2), 0, Infinity),
      y: clamp(center.y - Math.floor(chunkSize.h / 2), 0, Infinity)
    };
    const shouldSkip =
      !force && currentChunk.x === newChunk.x && currentChunk.y === newChunk.y;
    if (shouldSkip) return;

    Object.assign(currentChunk, newChunk);

    currentChunkContainer.destroy();
    currentChunkContainer = new PIXI.Container();
    mapContainer.addChild(currentChunkContainer);

    cells.forEach(cell => {
      const { x, y } = cell.position;

      if (
        x < currentChunk.x ||
        x > currentChunk.x + currentChunk.w ||
        y < currentChunk.y ||
        y > currentChunk.y + currentChunk.h
      ) {
        return;
      }

      const tileContainer = new PIXI.Container();

      const key = getCellKey(cell);
      const variant =
        variantsCache.get(key) ?? randomInt(VARIANTS_BY_EDGES[cell.edge] - 1);
      variantsCache.set(key, variant);

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
  };

  return {
    container: mapContainer,
    cleanup() {
      console.log('map cleanup');
    },
    onStateUpdate(snapshot: GameStateSnapshotDto) {
      const count = cells.length;

      snapshot.fieldOfView.forEach(cell => {
        const key = getCellKey(cell);
        if (cellKeys[key]) return;
        cellKeys[key] = true;
        cells.push(cell);
      });

      if (cells.length !== count) {
        drawChunk(getCameraPosition(), true);
      }
    }
  };
};
