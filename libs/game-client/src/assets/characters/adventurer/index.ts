import url from './adventurer.png';
import asepriteMeta from './adventurer.json';
import { parseAsperiteAnimationSheet } from '../../../aseprite';

export const adventurer = {
  url,
  asepriteMeta: asepriteMeta,
  meta: parseAsperiteAnimationSheet(asepriteMeta)
};
