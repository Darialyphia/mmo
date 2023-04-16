import type { CharacterResource } from '../types';

export const characters = {} satisfies Record<string, CharacterResource>;

export type Characters = typeof characters;
