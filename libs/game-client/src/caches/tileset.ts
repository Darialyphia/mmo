import * as PIXI from 'pixi.js';
import { isNumber } from '@mmo/shared';
import { BIOME_TO_TILESET } from '../utils/map';
import { tilesets } from '../assets/tilesets';
import { createTileset } from '../createTileset';

const tilesetMap = new Map<string, PIXI.Spritesheet>();

export const loadTilesets = async () => {
  await Promise.all(
    Object.entries(tilesets).map(async ([name, { url, asepriteMeta }]) => {
      const tileset = await createTileset({
        asepriteMeta,
        url,
        name
      });

      tilesetMap.set(name, tileset);
    })
  );
};

export const getTileset = (id: string | number) => {
  if (isNumber(id)) {
    const mapping = BIOME_TO_TILESET[id];
    if (!mapping) {
      throw new Error(`Unknown biome: ${id}`);
    }
    id = mapping;
  }
  const tileset = tilesetMap.get(id);

  if (!tileset) {
    throw new Error(`Unknown tileset: ${id}`);
  }

  return tileset;
};
