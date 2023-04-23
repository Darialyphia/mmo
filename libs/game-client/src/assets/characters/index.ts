import type { CharacterResource } from '../types';
import { rig } from './rig';
import { zombie } from './zombie';

export const characters = {
  rig,
  zombie
} satisfies Record<string, CharacterResource>;

export type Characters = typeof characters;

export const charactersBundle = Object.fromEntries(
  Object.entries(characters).map(([k, v]) => [k, v.url])
);
