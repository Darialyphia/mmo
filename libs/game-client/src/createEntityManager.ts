import * as PIXI from 'pixi.js';
import {
  isDefined,
  type Keys,
  type Nullable,
  type Entity,
  type Point,
  GameMeta,
  subVector
} from '@mmo/shared';
import { createAnimatedSprite } from './createAnimatedSprite';
import { Camera } from './createCamera';
import { GameState } from '.';
import { coordsToPixels, interpolateEntity } from './utils';
import { CELL_SIZE } from './constants';
import { config } from './config';

export const spriteMap = new Map<string, PIXI.Container>();

const DEBUG_COLOR_PER_BRAND = {
  player: 0x0000ff,
  monster: 0xff0000,
  obstacle: 0xffffff
};

const createEntity = (entity: Entity) => {
  const container = new PIXI.Container();

  const sprite = createAnimatedSprite(entity.spriteId, 'idle');
  const { texture } = sprite;

  const size = {
    x: entity.size.w * CELL_SIZE,
    y: entity.size.h * CELL_SIZE
  };
  const diff = {
    x: CELL_SIZE / 2 + (texture.width - size.x * 2),
    y: CELL_SIZE / 2 + (texture.height - size.y * 2)
  };

  sprite.position.set(-diff.x, -diff.y);

  if (config.debug) {
    const box = new PIXI.Graphics();

    const color = DEBUG_COLOR_PER_BRAND[entity.brand];
    box.lineStyle({ width: 1, color });
    box.beginFill(color, 0.5);
    box.drawRect(0, 0, entity.size.w * CELL_SIZE, entity.size.h * CELL_SIZE);
    container.addChild(box);
  } else {
    container.addChild(sprite);
  }
  container.cullable = true;

  return container;
};

export const getOrCreateSprite = (entity: Entity) => {
  if (!spriteMap.has(entity.id)) {
    spriteMap.set(entity.id, createEntity(entity));
  }

  return spriteMap.get(entity.id)!;
};

type CreateEntityManagerOptions = {
  camera: Camera;
  app: PIXI.Application;
  meta: GameMeta;
};

type ManagerEntity = {
  data: Entity;
  prevData: Nullable<Entity>;
  timestamp: number;
  prevTimestamp: number;
};

export const createEntityManager = ({
  camera,
  app,
  meta
}: CreateEntityManagerOptions) => {
  let entities: ManagerEntity[] = [];

  const debugContainer = new PIXI.Container();
  debugContainer.zIndex = meta.height + 1;

  camera.container.addChild(debugContainer);

  const interpolateEntities = () => {
    const now = performance.now();
    entities.forEach(async entity => {
      const sprite = getOrCreateSprite(entity.data);

      const position = entity.prevData?.position
        ? interpolateEntity(
            {
              value: entity.data.position,
              timestamp: entity.timestamp
            },
            {
              value: entity.prevData.position,
              timestamp: entity.prevTimestamp
            },
            { now }
          )
        : entity.data.position;

      const toPixels = coordsToPixels(
        subVector(position, {
          x: entity.data.size.w / 2,
          y: entity.data.size.h / 2
        })
      );
      sprite.position.set(toPixels.x, toPixels.y);
    });
  };

  const centerOnPlayer = () => {
    camera.centerOn(meta.sessionId);
  };
  app.ticker.add(interpolateEntities);
  app.ticker.add(centerOnPlayer);

  return {
    onStateUpdate(snapshot: GameState, prevSnapshot: GameState) {
      entities.forEach(entity => {
        if (entity.data.brand === 'obstacle') return;

        if (!isDefined(snapshot.entitiesById[entity.data.id])) {
          const sprite = getOrCreateSprite(entity.data);
          camera.container.removeChild(sprite);
        }
      });

      entities = snapshot.entities.map(entity => {
        return {
          data: entity,
          prevData: prevSnapshot.entitiesById[entity.id],
          timestamp: snapshot.timestamp,
          prevTimestamp: prevSnapshot.timestamp
        };
      });

      debugContainer.removeChildren();

      entities.forEach(entity => {
        const sprite = getOrCreateSprite(entity.data);
        // sprite.scale.x = entity.data.orientation === 'left' ? -1 : 1;
        sprite.zIndex = entity.data.position.y;
        if (camera.container.children.indexOf(sprite) < 0) {
          camera.container.addChild(sprite);
        }

        if (config.debug && entity.data.path) {
          const g = new PIXI.Graphics();
          debugContainer.addChild(g);
          g.lineStyle({ width: 1, color: 0xffff00 });
          const start = coordsToPixels(entity.data.position);
          g.moveTo(start.x, start.y);
          entity.data.path.forEach(point => {
            const { x, y } = coordsToPixels(point);
            g.lineTo(x, y);
          });
        }
      });
    }
  };
};
