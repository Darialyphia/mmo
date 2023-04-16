import type { CharacterResource } from '../types';
import { adventurer } from './adventurer';
import { enchantress } from './enchantress';

export const characters = {
  adventurer,
  enchantress
} satisfies Record<string, CharacterResource>;

export type Characters = typeof characters;

export const charactersBundle = Object.fromEntries(
  Object.entries(characters).map(([k, v]) => [k, v.url])
);
