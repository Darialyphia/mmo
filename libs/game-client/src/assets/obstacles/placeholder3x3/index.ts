import url from './placeholder3x3.png';
import asepriteMeta from './placeholder3x3.json';
import { parseAsperiteAnimationSheet } from '../../../aseprite';

export const placeholder3x3 = {
  url,
  asepriteMeta: asepriteMeta,
  meta: parseAsperiteAnimationSheet(asepriteMeta)
};
