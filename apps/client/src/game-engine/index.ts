import type {
  AsyncReturnType,
  GameMeta,
  GameStateSnapshotDto,
  MapLayout,
  Player
} from '@mmo/shared';
import * as PIXI from 'pixi.js';
import { createMap } from './createMap';
import { createEntity, playerSpritesById } from './createEntity';
import { coordsToPixels, enablePIXIDevtools, interpolateEntity } from './utils';
import { createCamera } from './createCamera';
import { Stage } from '@pixi/layers';
import type { Socket } from 'socket.io-client';
import { createControls } from './createControls';

PIXI.Container.defaultSortableChildren = true;
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

export type GameState = {
  players: Player[];
  playersById: Record<string, Player>;
  timestamp: number;
};

const createGameState = (): GameState => {
  return {
    players: [],
    playersById: {},
    timestamp: performance.now()
  };
};

export type CreateGameEngineOptions = {
  container: HTMLElement;
  sessionId: string;
  meta: GameMeta;
  socket: Socket;
};

export const createGameEngine = async ({
  container,
  sessionId,
  meta,
  socket
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
  enablePIXIDevtools(app);

  // create the stage instead of container
  app.stage = new Stage();

  const camera = createCamera(app);
  const map = await createMap({ app, camera, meta });
  const controls = createControls();
  controls.on('move', directions => {
    socket.emit('move', directions);
  });
  camera.container.addChild(map.container);
  app.stage.addChild(camera.container);

  let state = createGameState();
  let prevState = createGameState();

  const interpolateEntities = () => {
    const now = performance.now();
    state.players.forEach(async player => {
      if (!playerSpritesById[player.id]) {
        const entity = await createEntity(player);
        camera.container.addChild(entity);
      }
      const sprite = playerSpritesById[player.id];

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
      sprite!.position.set(toPixels.x, toPixels.y);
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

  return {
    canvas: app.view,
    updateState(newState: GameStateSnapshotDto) {
      prevState = state;
      state = {
        players: newState.players,
        playersById: Object.fromEntries(newState.players.map(p => [p.id, p])),
        timestamp: performance.now()
      };
      map.onStateUpdate(newState);
    },
    cleanup() {
      camera.cleanup();
      map.cleanup();
      app.destroy();
    }
  };
};

export type GameEngine = AsyncReturnType<typeof createGameEngine>;
