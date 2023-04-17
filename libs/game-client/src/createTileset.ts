import type { Size } from '@mmo/shared';
import * as PIXI from 'pixi.js';
import { AsepriteSheet } from './aseprite';
import { CELL_SIZE } from './constants';

export type CreateTileSetOptions = {
  asepriteMeta: AsepriteSheet;
  name: string;
  url: string;
};

export const createTileset = async ({
  asepriteMeta,
  name,
  url
}: CreateTileSetOptions): Promise<PIXI.Spritesheet> => {
  const columns = asepriteMeta.meta.size.w / CELL_SIZE;
  const rows = asepriteMeta.meta.size.h / CELL_SIZE;
  const tileCount = columns * rows;
  const data = {
    frames: Object.fromEntries(
      Array.from({ length: tileCount }, (_, index) => {
        const textureId = `${name}-${index}`;

        // avoids console warnings with HMR
        if (import.meta.env.DEV) {
          PIXI.Texture.removeFromCache(textureId);
        }

        return [
          textureId,
          {
            frame: {
              x: (index % columns) * CELL_SIZE,
              y: Math.floor(index / columns) * CELL_SIZE,
              w: CELL_SIZE,
              h: CELL_SIZE
            },
            sourceSize: { w: CELL_SIZE, h: CELL_SIZE },
            spriteSourceSize: {
              x: 0,
              y: 0,
              w: CELL_SIZE,
              h: CELL_SIZE
            }
          }
        ];
      })
    ),
    meta: {
      image: url,
      size: asepriteMeta.meta.size,
      scale: '1'
    }
  };

  const texture = await PIXI.Assets.load(url);
  const spritesheet = new PIXI.Spritesheet(texture, data);

  await spritesheet.parse();
  return spritesheet;
};
