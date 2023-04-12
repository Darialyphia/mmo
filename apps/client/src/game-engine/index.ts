import type { AsyncReturnType, MapLayout, Point } from '@mmo/shared';
import * as PIXI from 'pixi.js';
import { createStage } from './createStage';
import { createEntity, playerSpritesById } from './createEntity';
import { coordsToPixels, interpolateEntity } from './utils';
import { createCamera } from './createCamera';
// import {  PlayerControls } from './createControls';
// import { createMouseTracker } from './createMouseTracker';
import { CELL_SIZE } from './constants';

export type User = {
  position: Point;
  color: number;
  id: string;
};

export type GameEngine = AsyncReturnType<typeof createGameEngine>;
export type CreateGameEngineOptions = {
  container: HTMLElement;
  sessionId: string;
  gameWorld: { map: MapLayout };
};

export type GameState = {
  players: User[];
  playersById: Record<string, User>;
  timestamp: number;
};

export type UpdateGameStatePayload = {
  players: User[];
};

const createGameState = (): GameState => {
  return {
    players: [],
    playersById: {},
    timestamp: performance.now()
  };
};

export const createGameEngine = async ({
  container,
  sessionId,
  gameWorld
}: CreateGameEngineOptions) => {
  const { width, height } = container.getBoundingClientRect();

  const app = new PIXI.Application({
    width,
    height,
    autoDensity: true,
    antialias: false,
    backgroundAlpha: 0,
    resizeTo: container
  });
  if (import.meta.env.DEV) {
    // @ts-ignore enables PIXI devtools
    window.PIXI = PIXI;
    // @ts-ignore enables PIXI devtools
    window.__PIXI_APP__ = app;
  }
  PIXI.Container.defaultSortableChildren = true;
  PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

  const camera = createCamera(app);

  app.stage.addChild(camera.container);
  const canvas = app.view as unknown as HTMLCanvasElement;
  // const mouseTracker = createMouseTracker(canvas);
  // const controls = new PlayerControls({
  //   mousePosition: mouseTracker,
  //   canvas,
  //   camera
  // });

  const mapContainer = await createStage({ app, camera, gameWorld });
  camera.container.addChild(mapContainer);

  let state = createGameState();
  let prevState = createGameState();

  const interpolateEntities = () => {
    const now = performance.now();
    state.players.forEach(async player => {
      const sprite =
        playerSpritesById[player.id] ??
        (await createEntity(camera.container, player));

      const oldPlayer = prevState.playersById[player.id];

      const position = oldPlayer
        ? interpolateEntity(
            {
              value: player.position,
              timestamp: state.timestamp
            },
            { value: oldPlayer.position, timestamp: prevState.timestamp },
            { now }
          )
        : player.position;

      const toPixels = coordsToPixels(position);
      sprite.position.set(toPixels.x, toPixels.y);
    });
  };

  const centerCameraOnPlayer = () => {
    const player = state.playersById[sessionId];
    if (!player) return;

    const sprite = playerSpritesById[player.id];
    if (!sprite) return;

    camera.update(sprite.position);
  };

  app.ticker.add(() => {
    interpolateEntities();
    centerCameraOnPlayer();
  });
  window.addEventListener('resize', app.resize);

  return {
    canvas,
    updateState(newState: UpdateGameStatePayload) {
      prevState = state;
      state = {
        players: newState.players,
        playersById: Object.fromEntries(newState.players.map(p => [p.id, p])),
        timestamp: performance.now()
      };
    },
    cleanup() {
      window.removeEventListener('resize', app.resize);
      app.destroy();
    }
  };
};
