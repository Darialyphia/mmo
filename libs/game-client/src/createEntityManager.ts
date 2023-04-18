import * as PIXI from 'pixi.js';
import {
  isDefined,
  type Keys,
  type Nullable,
  type Entity,
  type Point
} from '@mmo/shared';
import { createAnimatedSprite } from './createAnimatedSprite';
import { Characters } from './assets/characters';
import { Camera } from './createCamera';
import { GameState } from '.';
import { coordsToPixels, interpolateEntity } from './utils';

export const spriteMap = new Map<string, PIXI.Container>();

const createEntity = (entity: Entity) => {
  const container = new PIXI.Container();

  const sprite = createAnimatedSprite(
    entity.character as Keys<Characters>,
    'idle'
  );
  container.addChild(sprite);

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
};

type ManagerEntity = {
  data: Entity;
  prevData: Nullable<Entity>;
  timestamp: number;
  prevTimestamp: number;
};

export const createEntityManager = ({
  camera,
  app
}: CreateEntityManagerOptions) => {
  let entities: ManagerEntity[] = [];

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

      const toPixels = coordsToPixels(position);
      sprite.position.set(toPixels.x, toPixels.y);
    });
  };

  app.ticker.add(interpolateEntities);

  return {
    onStateUpdate(snapshot: GameState, prevSnapshot: GameState) {
      entities.forEach(entity => {
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

      entities.forEach(entity => {
        const sprite = getOrCreateSprite(entity.data);
        sprite.scale.x = entity.data.orientation === 'left' ? -1 : 1;
        if (camera.container.children.indexOf(sprite) < 0) {
          camera.container.addChild(sprite);
        }
      });
    }
  };
};
