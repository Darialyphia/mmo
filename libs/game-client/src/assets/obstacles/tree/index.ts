import url from './tree.png';
import asepriteMeta from './tree.json';
import { parseAsperiteAnimationSheet } from '../../../aseprite';

export const tree = {
  url,
  asepriteMeta: asepriteMeta,
  meta: parseAsperiteAnimationSheet(asepriteMeta)
};
