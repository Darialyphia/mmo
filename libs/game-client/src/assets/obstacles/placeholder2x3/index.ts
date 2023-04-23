import url from './placeholder2x3.png';
import asepriteMeta from './placeholder2x3.json';
import { parseAsperiteAnimationSheet } from '../../../aseprite';

export const placeholder2x3 = {
  url,
  asepriteMeta: asepriteMeta,
  meta: parseAsperiteAnimationSheet(asepriteMeta)
};
