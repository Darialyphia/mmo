import {
  clamp,
  type AsyncReturnType,
  type MapLayout,
  type Point
} from '@mmo/shared';
import * as PIXI from 'pixi.js';
import { createStage } from './createStage';
import { createEntity, playerSpritesById } from './createEntity';
import { coordsToPixels, interpolateEntity } from './utils';
import { createCamera } from './createCamera';
// import {  PlayerControls } from './createControls';
// import { createMouseTracker } from './createMouseTracker';
import { CELL_SIZE } from './constants';

if (import.meta.env.DEV) {
  // @ts-ignore enables PIXI devtools
  window.PIXI = PIXI;
}

export type User = {
  position: Point;
  color: number;
  id: string;
};

export type GameEngine = AsyncReturnType<typeof createGameEngine>;
export type CreateGameCanvasOptions = {
  container: HTMLElement;
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
  gameWorld
}: CreateGameCanvasOptions) => {
  const { width, height } = container.getBoundingClientRect();

  const app = new PIXI.Application({
    width,
    height,
    autoDensity: true,
    antialias: false,
    backgroundAlpha: 0,
    resizeTo: container
  });
  PIXI.Container.defaultSortableChildren = true;
  PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

  const camera = createCamera();
  const canvas = app.view as unknown as HTMLCanvasElement;
  // const mouseTracker = createMouseTracker(canvas);
  // const controls = new PlayerControls({
  //   mousePosition: mouseTracker,
  //   canvas,
  //   camera
  // });

  const gameContainer = new PIXI.Container();
  const mapContainer = await createStage(gameWorld);
  gameContainer.addChild(mapContainer);

  let state = createGameState();
  let prevState = createGameState();

  const interpolateEntities = () => {
    const now = performance.now();
    state.players.forEach(async player => {
      const sprite =
        playerSpritesById[player.id] ??
        (await createEntity(gameContainer, player));

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
    const sprite = state.players[0];
    if (!sprite) return;

    camera.update({
      x: clamp(
        sprite.position.x * CELL_SIZE,
        app.screen.width / 2 / camera.view.scale - CELL_SIZE / 2,

        app.stage.width -
          app.screen.width / 2 / camera.view.scale -
          CELL_SIZE / 2
      ),
      y: clamp(
        sprite.position.y * CELL_SIZE,
        app.screen.height / 2 / camera.view.scale - CELL_SIZE / 2,
        app.stage.height -
          app.screen.height / 2 / camera.view.scale -
          CELL_SIZE / 2
      )
    });
    camera.apply(app.screen, gameContainer);
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
      const [player] = state.players;
      if (!player) return;

      const sprite = playerSpritesById[player.id];
      if (!sprite) return;
    },
    cleanup() {
      window.removeEventListener('resize', app.resize);
      app.destroy();
    }
  };
};
