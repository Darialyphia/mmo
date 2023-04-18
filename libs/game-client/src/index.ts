import type {
  AsyncReturnType,
  GameMeta,
  GameStateSnapshotDto,
  MapCell,
  Entity
} from '@mmo/shared';
import * as PIXI from 'pixi.js';
import { createMap } from './createMap';
import { enablePIXIDevtools } from './utils';
import { createCamera } from './createCamera';
import { Stage } from '@pixi/layers';
import type { Socket } from 'socket.io-client';
import { createControls } from './createControls';
import { loadCharactersBundle } from './createAnimatedSprite';
import { createEntityManager, getOrCreateSprite } from './createEntityManager';
import { loadTilesets } from './caches/tileset';

PIXI.Container.defaultSortableChildren = true;
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

export type GameState = {
  entities: Entity[];
  entitiesById: Record<string, Entity>;
  timestamp: number;
  fieldOfView: MapCell[];
};

const createGameState = (): GameState => {
  return {
    entities: [],
    entitiesById: {},
    fieldOfView: [],
    timestamp: performance.now()
  };
};

export type CreateGameClientOptions = {
  container: HTMLElement;
  meta: GameMeta;
  socket: Socket;
};

export const createGameClient = async ({
  container,
  meta,
  socket
}: CreateGameClientOptions) => {
  await Promise.all([loadTilesets(), loadCharactersBundle()]);

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
  app.stage = new Stage();

  const camera = createCamera({ app, meta });
  const map = await createMap({ app, camera, meta });
  const entityManager = createEntityManager({ app, camera, meta });
  const controls = createControls();
  controls.on('move', directions => {
    socket.emit('move', directions);
  });
  camera.container.addChild(map.container);
  app.stage.addChild(camera.container);

  let state = createGameState();

  return {
    canvas: app.view,
    updateState(newState: GameStateSnapshotDto) {
      const prevState = state;
      state = {
        entities: newState.entities,
        entitiesById: Object.fromEntries(newState.entities.map(p => [p.id, p])),
        fieldOfView: newState.fieldOfView,
        timestamp: performance.now()
      };

      camera.onStateUpdate(state);
      entityManager.onStateUpdate(state, prevState);
      map.onStateUpdate(state);
    },
    cleanup() {
      camera.cleanup();
      map.cleanup();
      app.destroy();
    }
  };
};

export type GameClient = AsyncReturnType<typeof createGameClient>;
