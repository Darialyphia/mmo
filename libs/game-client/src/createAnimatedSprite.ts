import * as PIXI from 'pixi.js';
import { Assets, type AnimatedSprite, type Texture } from 'pixi.js';
import { Characters, characters, charactersBundle } from './assets/characters';
import { Keys } from '@mmo/shared';
import { createSpritesheetFrameObject } from './aseprite';
import { getSpritesheet } from './caches/sprites';
import { Obstacles, obstacles } from './assets/obstacles';
import { CELL_SIZE } from './constants';

const allEntities = {
  ...obstacles,
  ...characters
} as const;

export const createAnimatedSprite = (id: string, initialAnimation: string) => {
  const { meta } = allEntities[id as keyof typeof allEntities];

  const sprite = new PIXI.AnimatedSprite(
    createSpritesheetFrameObject(initialAnimation, getSpritesheet(id), meta)
  );

  sprite.play();

  return sprite;
};
