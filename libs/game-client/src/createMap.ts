import * as PIXI from 'pixi.js';
import {
  type Rectangle,
  type Point,
  type GameMeta,
  type MapCell,
  clamp,
  createIndexedArray
} from '@mmo/shared';
import { CELL_SIZE } from './constants';
import type { Camera } from './createCamera';
import { throttle, isEqual } from 'lodash-es';
import type { GameState } from '.';
import { getCellKey, getCellTexture, getNeighbors } from './utils/map';

export type CreateMapOptions = {
  app: PIXI.Application;
  camera: Camera;
  meta: GameMeta;
};

export const createMap = async ({ app, camera, meta }: CreateMapOptions) => {
  const spriteCache = new Map<string, PIXI.Sprite>();

  const cells = createIndexedArray<MapCell>([]).addIndex('key', cell =>
    getCellKey(cell.position)
  );
  // The cells whose texture have been evaluated but information about surrounfing tiles was missing
  const undecidedEdges = new Map<string, true>();

  const mapContainer = new PIXI.Container();
  camera.container.addChild(mapContainer);

  const backdrop = new PIXI.Graphics();
  backdrop.beginFill(0x000000, 0.01);
  backdrop.drawRect(0, 0, meta.width * CELL_SIZE, meta.height * CELL_SIZE);
  backdrop.endFill();
  mapContainer.addChild(backdrop);

  let currentChunkContainer = new PIXI.Container();
  mapContainer.addChild(currentChunkContainer);

  const getChunkThreshold = () => ({
    x: app.screen.width / 2 / CELL_SIZE / camera.container.scale.x,
    y: app.screen.height / 2 / CELL_SIZE / camera.container.scale.x
  });

  const getChunkSize = () => ({
    w: Math.ceil(
      (app.screen.width / CELL_SIZE / camera.container.scale.x) * 1.5
    ),
    h: Math.ceil(
      (app.screen.height / CELL_SIZE / camera.container.scale.y) * 1.5
    )
  });

  const currentChunk: Rectangle = {
    x: 0,
    y: 0,
    ...getChunkSize()
  };

  const getCameraPosition = () => {
    const center = camera.container.pivot;
    return {
      x: Math.floor(center.x / CELL_SIZE),
      y: Math.floor(center.y / CELL_SIZE)
    };
  };

  const computeTexture = (cell: MapCell) => {
    const neighbors = getNeighbors(cell, cells, meta);
    const isUndecided = neighbors.some(row => row.includes(undefined));
    if (isUndecided) {
      undecidedEdges.set(getCellKey(cell.position), true);
    } else {
      undecidedEdges.delete(getCellKey(cell.position));
    }

    return getCellTexture(neighbors, app.renderer);
  };

  const checkChunkEdges = () => {
    const cameraPosition = getCameraPosition();
    const threshold = getChunkThreshold();
    const left = cameraPosition.x - currentChunk.x < threshold.x;
    const right =
      currentChunk.x + currentChunk.w - cameraPosition.x < threshold.x;
    const top = cameraPosition.y - currentChunk.y < threshold.y;
    const bottom =
      currentChunk.y + currentChunk.h - cameraPosition.y < threshold.y;

    const isCloseToChunkEdge = left || right || top || bottom;

    if (isCloseToChunkEdge) {
      drawChunk(cameraPosition);
    }
  };

  const getOrCreateCellSprite = (cell: MapCell) => {
    const cellKey = getCellKey(cell.position);

    if (!spriteCache.has(cellKey)) {
      const texture = computeTexture(cell);
      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5, 0.5);
      sprite.cullable = true;
      sprite.alpha = 0;

      const increaseAlpha = () => {
        sprite.alpha += 0.2;
        if (sprite.alpha >= 1) {
          app.ticker.remove(increaseAlpha);
        }
      };
      app.ticker.add(increaseAlpha);

      spriteCache.set(cellKey, sprite);
    } else if (undecidedEdges.has(cellKey)) {
      const sprite = spriteCache.get(cellKey)!;
      const texture = computeTexture(cell);

      sprite.texture = texture;
      sprite.removeChildren();
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

    cells.getList().forEach(drawCell);
  }, 100);

  const drawChunk = (center: Point, force?: boolean) => {
    const { w, h } = getChunkSize();
    const newChunk = {
      x: clamp(center.x - Math.floor(w / 2), 0, Infinity),
      y: clamp(center.y - Math.floor(h / 2), 0, Infinity),
      w,
      h
    };

    const shouldSkip = !force && isEqual(currentChunk, newChunk);
    if (shouldSkip) return;

    Object.assign(currentChunk, newChunk);
    drawCells();
  };

  app.ticker.add(checkChunkEdges);

  return {
    cleanup() {
      console.log('map cleanup');
    },
    onStateUpdate(snapshot: GameState) {
      const count = cells.getList().length;

      snapshot.fieldOfView.forEach(cell => {
        const key = getCellKey(cell.position);
        if (cells.has('key', key)) return;
        cells.add(cell);
      });

      if (cells.size !== count) {
        drawChunk(getCameraPosition(), true);
      }
    }
  };
};
