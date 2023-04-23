import url from './rig.png';
import asepriteMeta from './rig.json';
import { parseAsperiteAnimationSheet } from '../../../aseprite';

export const rig = {
  url,
  asepriteMeta: asepriteMeta,
  meta: parseAsperiteAnimationSheet(asepriteMeta)
};
