import type { CharacterResource } from '../types';
import { adventurer } from './adventurer';
import { enchantress } from './enchantress';
import { zombie } from './zombie';

export const characters = {
  adventurer,
  enchantress,
  zombie
} satisfies Record<string, CharacterResource>;

export type Characters = typeof characters;

export const charactersBundle = Object.fromEntries(
  Object.entries(characters).map(([k, v]) => [k, v.url])
);
