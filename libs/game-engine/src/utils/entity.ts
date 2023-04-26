import { Rectangle, dist, fastDistCheck, isDefined } from '@mmo/shared';
import { BBox, Body, BodyType, Box, System } from 'detect-collisions';
import { GameEntity, WithFieldOfView, WithPosition } from '../types';
import { GameContext } from '../factories/context';

export const isBox = (body: Body): body is Box =>
  body.type === BodyType.Box && 'width' in body && 'height' in body;

export const bBoxToRect = (box: Box): Rectangle => {
  const rect = {
    x: box.x,
    y: box.y,
    w: box.width,
    h: box.height
  };

  return rect;
};

export const getEntitiesInFieldOfView = (
  entity: GameEntity & WithPosition & WithFieldOfView,
  { world, entities }: GameContext,
  { checkRadius } = { checkRadius: true }
) => {
  const rect = bBoxToRect(entity.box);

  return world
    .search({
      minX: rect.x - entity.fov,
      minY: rect.y - entity.fov,
      maxX: rect.x + entity.fov,
      maxY: rect.y + entity.fov
    })
    .filter(bbox => {
      if (!isBox(bbox)) return false;
      if (!checkRadius) return true;
      const rect2 = bBoxToRect(bbox);
      return fastDistCheck(rect, rect2, entity.fov);
    })
    .map(box => entities.getByIndex('box', box))
    .filter(isDefined);
};
