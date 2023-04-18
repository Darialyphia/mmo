import * as PIXI from 'pixi.js';
import { Assets, type AnimatedSprite, type Texture } from 'pixi.js';
import { Characters, characters, charactersBundle } from './assets/characters';
import { Keys } from '@mmo/shared';
import { createSpritesheetFrameObject } from './aseprite';

const spritesheetCache = new Map<PIXI.Texture, PIXI.Spritesheet>();

type TexturesMap = Record<Keys<Characters>, Texture>;
let texturesMap: TexturesMap;

export const loadCharactersBundle = async () => {
  await Assets.addBundle('characters', charactersBundle);

  texturesMap = await Assets.loadBundle('characters');

  await Promise.all(
    Object.entries(texturesMap).map(async ([name, texture]) => {
      const { meta } = characters[name as Keys<Characters>];

      const spritesheet = new PIXI.Spritesheet(texture, meta);
      spritesheetCache.set(texture, spritesheet);
      return spritesheet.parse();
    })
  );
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

export const getSpritesheet = (id: Keys<Characters>) => {
  const texture = texturesMap[id];

  if (!texture) {
    throw new Error(`Could not get texture for sprite ${id}`);
  }

  return spritesheetCache.get(texture)!;
};

export const createAnimatedSprite = (
  id: Keys<Characters>,
  initialAnimation: string
) => {
  const { meta } = characters[id];

  const sprite = new PIXI.AnimatedSprite(
    createSpritesheetFrameObject(initialAnimation, getSpritesheet(id), meta)
  );

  sprite.anchor.set(0.5, 0.5);
  sprite.play();

  return sprite;
};
