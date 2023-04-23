import url from './placeholder3x2.png';
import asepriteMeta from './placeholder3x2.json';
import { parseAsperiteAnimationSheet } from '../../../aseprite';

export const placeholder3x2 = {
  url,
  asepriteMeta: asepriteMeta,
  meta: parseAsperiteAnimationSheet(asepriteMeta)
};
