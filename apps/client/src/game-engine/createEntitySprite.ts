import {
  createSpritesheetFrameObject,
  parseAsperiteAnimationSheet
} from './utils';
import * as PIXI from 'pixi.js';
import { spritePaths } from './sprites';

export type CreateEntitySpriteOptions = {
  spriteSheet: any;
  initialAnimation: string;
};
const loadedTextures = new Map<string, Promise<PIXI.Texture>>();

export const createEntitySprite = async ({
  spriteSheet,
  initialAnimation
}: CreateEntitySpriteOptions) => {
  const path =
    spritePaths.entities[spriteSheet.id as keyof typeof spritePaths.entities];
  // avoid console warinings with HMR
  if (!loadedTextures.has(path)) {
    loadedTextures.set(path, PIXI.Assets.load(path) as Promise<PIXI.Texture>);
  }

  const texture = (await loadedTextures.get(path)) as PIXI.Texture;

  const data = parseAsperiteAnimationSheet(spriteSheet.spritesheetData);
  const sheet = new PIXI.Spritesheet(texture, data);
  await sheet.parse();

  const sprite = new PIXI.AnimatedSprite(
    createSpritesheetFrameObject(initialAnimation, sheet, data)
  );

  sprite.anchor.set(0.5, 0.5);
  sprite.play();
  // sprite.anchor.set(0.5, 0.5);

  return sprite;
};
