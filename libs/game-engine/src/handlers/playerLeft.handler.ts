import { GameContext } from '../factories/context';

export type PlayerLeftEvent = {
  type: 'player left';
  payload: { playerId: string };
};

export const onPlayerLeft = (
  { playerId }: PlayerLeftEvent['payload'],
  { entities, entitiesLookup, grid, gridLookup }: GameContext
) => {
  const player = entitiesLookup.get(playerId);
  if (!player) return;

  entities.splice(entities.indexOf(player), 1);
  grid.remove(player.gridItem);
  entitiesLookup.delete(player.id);
  gridLookup.delete(player.gridItem);
};
