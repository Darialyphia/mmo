import type { TilesetResource } from '../types';
import { baseTileset } from './base';
import { biomeSeamsTileset } from './biome-seams';
import { desertTileset } from './desert';
import { snowTileset } from './snow';

export const tilesets = {
  base: baseTileset,
  biomeSeams: biomeSeamsTileset,
  desert: desertTileset,
  snow: snowTileset
} satisfies Record<string, TilesetResource>;

export type Tilesets = typeof tilesets;
