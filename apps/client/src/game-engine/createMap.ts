import * as PIXI from 'pixi.js';
import {
  randomInt,
  type Rectangle,
  type Point,
  clamp,
  type GameMeta,
  type MapCell,
  type GameStateSnapshotDto,
  type MapCellAngle,
  MapCellEdge,
  isNever
} from '@mmo/shared';
import { createTileset } from './createTileset';
import { spritePaths } from './sprites';
import { CELL_SIZE } from './constants';
import type { Camera } from './createCamera';
import { throttle } from 'lodash-es';

const MAX_VARIANTS = 4;
const MAX_TILES_PER_TERRAIN = 6;
const TERRAINS_COUNT = 4;
const getCellKey = (pt: Point) => `${pt.x}:${pt.y}`;

type CreateMapOptions = {
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

const countEdges = (edges: [boolean, boolean, boolean, boolean]) =>
  edges.filter(edge => !!edge).length as Exclude<
    MapCellEdge,
    (typeof MapCellEdge)['CORNER']
  >;

type Edges = [boolean, boolean, boolean, boolean];

const isParallelTwoSides = (edges: Edges) => {
  const edgesCount = countEdges(edges);
  const [isTopEdge, isBottomEdge, isLeftEdge, isRightEdge] = edges;

  return (
    edgesCount === 2 &&
    ((isTopEdge && isBottomEdge) || (isLeftEdge && isRightEdge))
  );
};

const computeAngleOneSide = ([
  isTopEdge,
  ,
  isLeftEdge,
  isRightEdge
]: Edges): MapCellAngle => {
  if (isLeftEdge) return 0;
  if (isTopEdge) return 90;
  if (isRightEdge) return 180;
  return 270;
};

const computeAngleTwoSides = (edges: Edges): MapCellAngle => {
  const [isTopEdge, isBottomEdge, isLeftEdge, isRightEdge] = edges;

  if (isParallelTwoSides(edges)) return isLeftEdge ? 0 : 90;
  if (isLeftEdge && isTopEdge) return 0;
  if (isTopEdge && isRightEdge) return 90;
  if (isRightEdge && isBottomEdge) return 180;

  return 270;
};

const computeAngleThreeSides = ([
  isTopEdge,
  isBottomEdge,
  ,
  isRightEdge
]: Edges): MapCellAngle => {
  if (!isTopEdge) return 0;
  if (!isRightEdge) return 90;
  if (!isBottomEdge) return 180;
  return 270;
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
    Object.values(spritePaths.tileSets).map(path =>
      createTileset({
        ...tilesetBaseOptions,
        path
      })
    )
  );

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
    const neighbors = getNeighbors(cell, cellsByKey, meta);
    if (
      neighbors.top === undefined ||
      neighbors.bottom === undefined ||
      neighbors.left === undefined ||
      neighbors.right === undefined
    ) {
      undecidedEdges.set(getCellKey(cell.position), true);
    } else {
      undecidedEdges.delete(getCellKey(cell.position));
    }

    const edges: [boolean, boolean, boolean, boolean] = [
      isDefined(neighbors.top) && neighbors.top.height < cell.height,
      isDefined(neighbors.bottom) && neighbors.bottom.height < cell.height,
      isDefined(neighbors.left) && neighbors.left.height < cell.height,
      isDefined(neighbors.right) && neighbors.right.height < cell.height
    ];

    const edgesCount = countEdges(edges);

    switch (edgesCount) {
      case MapCellEdge.NONE:
        return { edge: edgesCount, angle: 0 };
      case MapCellEdge.ONE_SIDE:
        return { edge: edgesCount, angle: computeAngleOneSide(edges) };
      case MapCellEdge.TWO_SIDES:
        return {
          edge: isParallelTwoSides(edges) ? edgesCount : MapCellEdge.CORNER,
          angle: computeAngleTwoSides(edges)
        };
      case MapCellEdge.THREE_SIDES:
        return { edge: edgesCount, angle: computeAngleThreeSides(edges) };
      case MapCellEdge.ALL_SIDES:
        return { edge: edgesCount, angle: 0 };
      default:
        isNever(edgesCount);
    }
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
      const { edge, angle } = computeCellEdges(cell)!;
      const tileIndex =
        (cell.height * MAX_TILES_PER_TERRAIN + edge) * MAX_VARIANTS +
        randomInt(MAX_VARIANTS - 1);

      const sheet = sheets[cell.temperature]!;

      const sprite = new PIXI.Sprite(sheet.textures[`${tileIndex}`]);
      sprite.anchor.set(0.5, 0.5);
      sprite.angle = angle;
      sprite.cullable = true;
      sprite.alpha = 0;

      const increaseAlpha = () => {
        sprite.alpha += 0.05;
        if (sprite.alpha >= 1) {
          app.ticker.remove(increaseAlpha);
        }
      };
      app.ticker.add(increaseAlpha);

      spriteCache.set(cellKey, sprite);
    } else if (undecidedEdges.has(cellKey)) {
      const sprite = spriteCache.get(cellKey)!;
      const { edge, angle } = computeCellEdges(cell)!;
      const tileIndex =
        (cell.height * MAX_TILES_PER_TERRAIN + edge) * MAX_VARIANTS +
        randomInt(MAX_VARIANTS - 1);

      const sheet = sheets[cell.temperature]!;

      sprite.angle = angle;
      sprite.texture = sheet.textures[`${tileIndex}`]!;
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
  }, 150);

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
