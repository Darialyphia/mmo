import { GameContext } from '../factories/context';
import { createPlayer, GamePlayer } from '../factories/player';

export type PlayerJoinedEvent = {
  type: 'player joined';
  payload: { playerId: string };
};

export const onPlayerJoined = (
  { playerId }: PlayerJoinedEvent['payload'],
  ctx: GameContext
): GamePlayer => {
  const player = createPlayer(playerId, ctx);
  ctx.entities.push(player);
  ctx.entitiesLookup.set(player.id, player);
  ctx.gridLookup.set(player.gridItem, player);

  return player;
};
