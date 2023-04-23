import url from './placeholder2x2.png';
import asepriteMeta from './placeholder2x2.json';
import { parseAsperiteAnimationSheet } from '../../../aseprite';

export const placeholder2x2 = {
  url,
  asepriteMeta: asepriteMeta,
  meta: parseAsperiteAnimationSheet(asepriteMeta)
};
