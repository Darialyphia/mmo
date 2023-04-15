import baseTileset from '@/assets/tilesets/base.png';
import desertTileset from '@/assets/tilesets/desert.png';
import snowTileset from '@/assets/tilesets/snow.png';
import biomeSeams from '@/assets/tilesets/biome-seams.png';

export const spritePaths = {
  utils: {
    biomeSeams
  },
  tileSets: { base: baseTileset, desert: desertTileset, snow: snowTileset },
  entities: {}
} as const;
