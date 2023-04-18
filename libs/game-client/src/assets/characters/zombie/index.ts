import url from './zombie.png';
import asepriteMeta from './zombie.json';
import { parseAsperiteAnimationSheet } from '../../../aseprite';

export const zombie = {
  url,
  asepriteMeta: asepriteMeta,
  meta: parseAsperiteAnimationSheet(asepriteMeta)
};
