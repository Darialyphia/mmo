import url from './enchantress.png';
import asepriteMeta from './enchantress.json';
import { parseAsperiteAnimationSheet } from '../../../aseprite';

export const enchantress = {
  url,
  asepriteMeta: asepriteMeta,
  meta: parseAsperiteAnimationSheet(asepriteMeta)
};
