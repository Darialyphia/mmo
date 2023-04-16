import type { ISpritesheetData } from 'pixi.js';
import { AsepriteSheet } from '../aseprite';

export type CharacterResource = {
  url: string;
  asepriteMeta: AsepriteSheet;
  meta: ISpritesheetData;
};

export type TilesetResource = {
  url: string;
  asepriteMeta: AsepriteSheet;
};
