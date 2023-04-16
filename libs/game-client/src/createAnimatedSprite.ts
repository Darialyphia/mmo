// import { spritePaths } from './sprites';
// import * as PIXI from 'pixi.js';
// import { Assets, type AnimatedSprite, type Texture } from 'pixi.js';

// export type SpriteName = keyof (typeof spritePaths)['characters'];

// const spritesCache = new Map<string, PIXI.AnimatedSprite>();
// const spritesheetCache = new Map<PIXI.Texture, PIXI.Spritesheet>();

// type TexturesMap = Record<keyof (typeof spritePaths)['characters'], Texture>;
// let texturesMap: TexturesMap;

// export const loadSpriteTextures = async () => {
//   await Assets.addBundle('characters', spritePaths.characters);

//   texturesMap = await Assets.loadBundle('characters');

//   await Promise.all(
//     Object.entries(texturesMap).map(async ([spriteName, texture]) => {
//       const { meta } = sprites[spriteName as SpriteName];

//       const spritesheet = new PIXI.Spritesheet(texture, meta);
//       spritesheetCache.set(texture, spritesheet);
//       return spritesheet.parse();
//     })
//   );
// };

// export const updateTextures = (
//   id: string,
//   spriteName: SpriteName,
//   animation: string
// ) => {
//   const { meta } = sprites[spriteName];

//   const sprite = resolveRenderable<AnimatedSprite>(id);

//   sprite.textures = createSpritesheetFrameObject(
//     animation,
//     getSpritesheet(spriteName),
//     meta
//   );

//   sprite.play();
// };

// export const getSpritesheet = (id: SpriteName) => {
//   const texture = texturesMap[id];

//   if (!texture) {
//     throw new Error(`Could not get texture for sprite ${id}`);
//   }

//   return spritesheetCache.get(texture)!;
// };

// export const createAnimatedSprite = (
//   id: SpriteName,
//   initialAnimation: AnimationState
// ) => {
//   const { meta } = sprites[id];

//   const sprite = new PIXI.AnimatedSprite(
//     createSpritesheetFrameObject(initialAnimation, getSpritesheet(id), meta)
//   );

//   sprite.anchor.set(0.5, 0.5);
//   sprite.play();

//   return sprite;
// };
