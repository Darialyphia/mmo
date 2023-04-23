import url from './placeholder4x4.png';
import asepriteMeta from './placeholder4x4.json';
import { parseAsperiteAnimationSheet } from '../../../aseprite';

export const placeholder4x4 = {
  url,
  asepriteMeta: asepriteMeta,
  meta: parseAsperiteAnimationSheet(asepriteMeta)
};
