import type { CharacterResource } from '../types';
import { adventurer } from './adventurer';

export const characters = {
  adventurer
} satisfies Record<string, CharacterResource>;

export type Characters = typeof characters;

export const charactersBundle = Object.fromEntries(
  Object.entries(characters).map(([k, v]) => [k, v.url])
);
