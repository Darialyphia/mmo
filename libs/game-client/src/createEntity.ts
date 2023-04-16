import * as PIXI from 'pixi.js';
import type { Keys, Player } from '@mmo/shared';
import { CELL_SIZE } from './constants';
import { createAnimatedSprite } from './createAnimatedSprite';
import { Characters } from './assets/characters';

const playerCreationPromises = new Map<string, Promise<PIXI.Container>>();

export const playerSpritesById: Record<string, PIXI.Container> = {};

const addEntity = async (player: Player) => {
  const container = new PIXI.Container();
  playerSpritesById[player.id] = container;

  const sprite = createAnimatedSprite(
    player.character as Keys<Characters>,
    'idle'
  );
  container.addChild(sprite);

  return container;
};

export const createEntity = async (player: Player) => {
  if (!playerCreationPromises.has(player.id)) {
    playerCreationPromises.set(player.id, addEntity(player));
  }

  return playerCreationPromises.get(player.id)!;
};
