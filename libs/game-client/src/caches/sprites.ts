import * as PIXI from 'pixi.js';
import { Assets, type AnimatedSprite, type Texture } from 'pixi.js';
import { Characters, characters, charactersBundle } from '../assets/characters';
import { Keys } from '@mmo/shared';
import { createSpritesheetFrameObject } from '../aseprite';
import { Obstacles, obstacles, obstaclesBundle } from '../assets/obstacles';

const spritesheetCache = new Map<PIXI.Texture, PIXI.Spritesheet>();

type TexturesMap = Record<string, Texture>;
const texturesMap: TexturesMap = {};

export const loadCharactersBundle = async () => {
  await Assets.addBundle('characters', charactersBundle);

  const textures: TexturesMap = await Assets.loadBundle('characters');
  await Promise.all(
    Object.entries(textures).map(async ([name, texture]) => {
      const { meta } = characters[name as Keys<Characters>];

      const spritesheet = new PIXI.Spritesheet(texture, meta);
      spritesheetCache.set(texture, spritesheet);
      return spritesheet.parse();
    })
  );

  Object.assign(texturesMap, textures);
};
export const loadObstaclesBundle = async () => {
  await Assets.addBundle('obstacles', obstaclesBundle);

  const textures: TexturesMap = await Assets.loadBundle('obstacles');

  await Promise.all(
    Object.entries(textures).map(async ([name, texture]) => {
      const { meta } = obstacles[name as Keys<Obstacles>];

      const spritesheet = new PIXI.Spritesheet(texture, meta);
      spritesheetCache.set(texture, spritesheet);
      return spritesheet.parse();
    })
  );

  Object.assign(texturesMap, textures);
};

export const updateTextures = (
  sprite: PIXI.AnimatedSprite,
  name: Keys<Characters>,
  animation: string
) => {
  const { meta } = characters[name];

  sprite.textures = createSpritesheetFrameObject(
    animation,
    getSpritesheet(name),
    meta
  );

  sprite.play();
};

export const getSpritesheet = (id: string) => {
  const texture = texturesMap[id];

  if (!texture) {
    throw new Error(`Could not get texture for sprite ${id}`);
  }

  return spritesheetCache.get(texture)!;
};
