import * as PIXI from 'pixi.js';
import {
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
import { getEdgeInfos, isHeightEdge, isBiomeEdge } from './utils';

const MAX_VARIANTS = 4;
const MAX_TILES_PER_TERRAIN = 6;
const TERRAINS_COUNT = 4;
const getCellKey = (pt: Point) => `${pt.x}:${pt.y}`;

export type CreateMapOptions = {
  app: PIXI.Application;
  camera: Camera;
  meta: GameMeta;
};

const getNeighbors = (
  { position }: MapCell,
  map: Map<string, MapCell>,
  meta: GameMeta
) => {
  const isLeftEdge = position.x === 0;
  const isRightEdge = position.x === meta.width - 1;
  const isTopEdge = position.y === 0;
  const isBottomEdge = position.y === meta.height - 1;

  return {
    top: isTopEdge
      ? null
      : map.get(getCellKey({ x: position.x, y: position.y - 1 })),
    bottom: isBottomEdge
      ? null
      : map.get(getCellKey({ x: position.x, y: position.y + 1 })),
    left: isLeftEdge
      ? null
      : map.get(getCellKey({ x: position.x - 1, y: position.y })),
    right: isRightEdge
      ? null
      : map.get(getCellKey({ x: position.x + 1, y: position.y }))
  };
};

export const createMap = async ({ app, camera, meta }: CreateMapOptions) => {
  const spriteCache = new Map<string, PIXI.Sprite>();

  const tilesetBaseOptions = {
    dimensions: {
      w: CELL_SIZE * MAX_VARIANTS,
      h: CELL_SIZE * TERRAINS_COUNT * MAX_TILES_PER_TERRAIN
    },
    tileSize: CELL_SIZE
  };

  const sheets = await Promise.all(
    Object.values(spritePaths.tileSets)
      .map(path =>
        createTileset({
          ...tilesetBaseOptions,
          path
        })
      )
      .concat(
        createTileset({
          dimensions: { w: CELL_SIZE, h: 6 * CELL_SIZE },
          tileSize: CELL_SIZE,
          path: spritePaths.utils.biomeSeams
        })
      )
  );
  const biomeSeamsSheet = sheets[3]!;

  const cells: MapCell[] = [];
  const cellsByKey = new Map<string, MapCell>();
  const undecidedEdges = new Map<string, true>();

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

  const computeCellEdges = (cell: MapCell) => {
    const { top, bottom, left, right } = getNeighbors(cell, cellsByKey, meta);
    if (
      top === undefined ||
      bottom === undefined ||
      left === undefined ||
      right === undefined
    ) {
      undecidedEdges.set(getCellKey(cell.position), true);
    } else {
      undecidedEdges.delete(getCellKey(cell.position));
    }

    return {
      terrain: getEdgeInfos([
        isHeightEdge(top, cell),
        isHeightEdge(bottom, cell),
        isHeightEdge(left, cell),
        isHeightEdge(right, cell)
      ]),
      biome: getEdgeInfos([
        isBiomeEdge(top, cell),
        isBiomeEdge(bottom, cell),
        isBiomeEdge(left, cell),
        isBiomeEdge(right, cell)
      ])
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
    const cellKey = getCellKey(cell.position);

    if (!spriteCache.has(cellKey)) {
      const { terrain, biome } = computeCellEdges(cell)!;
      const tileIndex =
        (cell.height * MAX_TILES_PER_TERRAIN + terrain.edge) * MAX_VARIANTS +
        randomInt(MAX_VARIANTS - 1);

      const sheet = sheets[cell.temperature]!;

      const sprite = new PIXI.Sprite(sheet.textures[tileIndex]);
      sprite.anchor.set(0.5, 0.5);
      sprite.angle = terrain.angle;
      sprite.cullable = true;
      sprite.alpha = 0;

      const increaseAlpha = () => {
        sprite.alpha += 0.06;
        if (sprite.alpha >= 1) {
          app.ticker.remove(increaseAlpha);
        }
      };
      app.ticker.add(increaseAlpha);

      if (biome.edge) {
        const biomeSprite = new PIXI.Sprite(
          biomeSeamsSheet.textures[biome.edge]
        );
        biomeSprite.anchor.set(0.5, 0.5);
        biomeSprite.angle = biome.angle - terrain.angle;
        biomeSprite.cullable = true;
        sprite.addChild(biomeSprite);
      }

      spriteCache.set(cellKey, sprite);
    } else if (undecidedEdges.has(cellKey)) {
      const sprite = spriteCache.get(cellKey)!;
      const { terrain, biome } = computeCellEdges(cell)!;
      const tileIndex =
        (cell.height * MAX_TILES_PER_TERRAIN + terrain.edge) * MAX_VARIANTS +
        randomInt(MAX_VARIANTS - 1);

      const sheet = sheets[cell.temperature]!;

      sprite.angle = terrain.angle;
      sprite.texture = sheet.textures[tileIndex]!;

      if (biome.edge) {
        sprite.removeChildren();
        const biomeSprite = new PIXI.Sprite(
          biomeSeamsSheet.textures[biome.edge]
        );
        biomeSprite.anchor.set(0.5, 0.5);
        biomeSprite.angle = biome.angle - terrain.angle;
        biomeSprite.cullable = true;
        sprite.addChild(biomeSprite);
      }
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
  }, 100);

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
        const key = getCellKey(cell.position);
        if (cellsByKey.has(key)) return;
        cellsByKey.set(key, cell);
        cells.push(cell);
      });

      if (cells.length !== count) {
        drawChunk(getCameraPosition(), true);
      }
    }
  };
};
