import { GameContext } from '../factories/context';

export type PlayerLeftEvent = {
  type: 'player left';
  payload: { playerId: string };
};

export const onPlayerLeft = (
  { playerId }: PlayerLeftEvent['payload'],
  { entities, grid }: GameContext
) => {
  const player = entities.getByIndex('id', playerId);
  if (!player) return;

  entities.delete(player);
  grid.remove(player.gridItem);
};
