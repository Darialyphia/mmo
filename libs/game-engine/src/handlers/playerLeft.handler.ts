import { GameContext } from '../factories/context';

export type PlayerLeftEvent = {
  type: 'player left';
  payload: { playerId: string };
};

export const onPlayerLeft = (
  { playerId }: PlayerLeftEvent['payload'],
  { entities, world }: GameContext
) => {
  const player = entities.getByIndex('id', playerId);
  if (!player) return;
  world.remove(player.box);
  entities.delete(player);
};
