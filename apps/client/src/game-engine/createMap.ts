import * as PIXI from 'pixi.js';
import {
  MapCellEdge,
  randomInt,
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
import { throttle } from 'lodash-es';

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

type CreateMapOptions = {
  app: PIXI.Application;
  camera: Camera;
  meta: GameMeta;
};
const getCellKey = (cell: MapCell) => `${cell.position.x}:${cell.position.y}`;

export const createMap = async ({ app, camera, meta }: CreateMapOptions) => {
  const variantsCache = new Map<string, number>();
  const spriteCache = new Map<string, PIXI.Sprite>();

  const tilesetOptions = {
    path: spritePaths.tileSets.base,
    id: 'baseTileset',
    dimensions: {
      w: CELL_SIZE * MAX_VARIANTS,
      h: CELL_SIZE * TERRAINS_COUNT * MAX_TILES_PER_TERRAIN
    },
    tileSize: CELL_SIZE
  };

  const sheet = await createTileset(tilesetOptions);

  const cells: MapCell[] = [];
  const cellKeys = new Map<string, number>();

  const mapContainer = new PIXI.Container();

  const backdrop = new PIXI.Graphics();
  backdrop.beginFill(0x000000, 0.01);
  backdrop.drawRect(0, 0, meta.width * CELL_SIZE, meta.height * CELL_SIZE);
  backdrop.endFill();
  mapContainer.addChild(backdrop);

  let currentChunkContainer = new PIXI.Container();
  mapContainer.addChild(currentChunkContainer);

  const chunkThreshold = {
    x: app.screen.width / 2 / CELL_SIZE / camera.container.scale.x,
    y: app.screen.height / 2 / CELL_SIZE / camera.container.scale.x
  };

  const chunkSize = {
    w: Math.ceil(
      (app.screen.width / CELL_SIZE / camera.container.scale.x) * 1.5
    ),
    h: Math.ceil(
      (app.screen.height / CELL_SIZE / camera.container.scale.y) * 1.5
    )
  };

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

  const checkChunkEdges = () => {
    const cameraPosition = getCameraPosition();

    const left = cameraPosition.x - currentChunk.x < chunkThreshold.x;
    const right =
      currentChunk.x + currentChunk.w - cameraPosition.x < chunkThreshold.x;
    const top = cameraPosition.y - currentChunk.y < chunkThreshold.y;
    const bottom =
      currentChunk.y + currentChunk.h - cameraPosition.y < chunkThreshold.y;

    const isCloseToChunkEdge = left || right || top || bottom;

    if (isCloseToChunkEdge) {
      drawChunk(cameraPosition);
    }
  };

  const getOrCreateCellSprite = (cell: MapCell) => {
    const cellKey = getCellKey(cell);

    if (!spriteCache.has(cellKey)) {
      const variant =
        variantsCache.get(cellKey) ??
        randomInt(VARIANTS_BY_EDGES[cell.edge] - 1);
      variantsCache.set(cellKey, variant);

      const tileIndex =
        (cell.terrain * MAX_TILES_PER_TERRAIN + cell.edge) * MAX_VARIANTS +
        variant;

      const sprite = new PIXI.Sprite(
        sheet.textures[`${tilesetOptions.id}-${tileIndex}`]
      );
      sprite.anchor.set(0.5, 0.5);
      sprite.angle = cell.angle;
      sprite.cullable = true;
      sprite.alpha = cellKeys.get(cellKey)!;

      const increaseAlpha = () => {
        sprite.alpha += 0.05;
        if (sprite.alpha >= 1) {
          app.ticker.remove(increaseAlpha);
        }
      };
      app.ticker.add(increaseAlpha);

      spriteCache.set(cellKey, sprite);
    }

    return spriteCache.get(cellKey)!;
  };

  const drawCell = (cell: MapCell) => {
    const { x, y } = cell.position;
    const isOutOfChunk =
      x < currentChunk.x ||
      x > currentChunk.x + currentChunk.w ||
      y < currentChunk.y ||
      y > currentChunk.y + currentChunk.h;

    if (isOutOfChunk) return;

    const tileContainer = new PIXI.Container();
    tileContainer.position.set(
      CELL_SIZE * cell.position.x,
      CELL_SIZE * cell.position.y
    );
    tileContainer.scale.set(1.0005, 1.0005); //remves rendering artifact, not sure wy they're here in the first place

    const sprite = getOrCreateCellSprite(cell);
    currentChunkContainer.addChild(tileContainer);

    tileContainer.addChild(sprite);
  };

  const drawCells = throttle(() => {
    currentChunkContainer.destroy();
    currentChunkContainer = new PIXI.Container();
    mapContainer.addChild(currentChunkContainer);

    cells.forEach(drawCell);
  }, 10);

  const drawChunk = (center: Point, force?: boolean) => {
    const newChunk = {
      x: clamp(center.x - Math.floor(chunkSize.w / 2), 0, Infinity),
      y: clamp(center.y - Math.floor(chunkSize.h / 2), 0, Infinity)
    };

    const isEqual =
      currentChunk.x === newChunk.x && currentChunk.y === newChunk.y;
    const shouldSkip = !force && isEqual;
    if (shouldSkip) return;

    Object.assign(currentChunk, newChunk);

    drawCells();
  };

  app.ticker.add(checkChunkEdges);

  return {
    container: mapContainer,
    cleanup() {
      console.log('map cleanup');
    },
    onStateUpdate(snapshot: GameStateSnapshotDto) {
      const count = cells.length;

      snapshot.fieldOfView.forEach(cell => {
        const key = getCellKey(cell);
        if (cellKeys.has(key)) return;
        cellKeys.set(key, 0);
        cells.push(cell);
      });

      if (cells.length !== count) {
        drawChunk(getCameraPosition(), true);
      }
    }
  };
};
