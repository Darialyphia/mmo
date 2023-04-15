import * as PIXI from 'pixi.js';
import type { Player } from '@mmo/shared';
import { CELL_SIZE } from './constants';

const playerCreationPromises = new Map<string, Promise<PIXI.Container>>();

export const playerSpritesById: Record<string, PIXI.Container> = {};

const addEntity = async (player: Player) => {
  const container = new PIXI.Container();
  playerSpritesById[player.id] = container;

  const g = new PIXI.Graphics();
  g.lineStyle(1);
  g.beginFill(
    new PIXI.Color({ h: player.color, s: 100, l: 65, a: 0.5 }).toArray(),
    1
  );
  g.drawCircle(CELL_SIZE / 2, CELL_SIZE / 2, CELL_SIZE * 0.33);
  g.endFill();
  // we offser the position by half a cell because cells are anchored on the center which naturally offsets them as well
  g.position.set(-(CELL_SIZE / 2), -(CELL_SIZE / 2));

  container.addChild(g);

  return container;
};

export const createEntity = async (player: Player) => {
  if (!playerCreationPromises.has(player.id)) {
    playerCreationPromises.set(player.id, addEntity(player));
  }

  return playerCreationPromises.get(player.id)!;
};
