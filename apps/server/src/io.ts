import { Server, Socket } from 'socket.io';
import type http from 'http';
import { handleCORS } from './middlewares/cors';
import { Player, Point } from '@mmo/shared';
import { Directions, GamePlayer, createGame } from './game';
import { logger } from './utils/logger';

type User = {
  position: Point;
  color: number;
  id: string;
};
let io: Server;
const usersBySocket = new Map<Socket, User>();
// const socketsByUserId = new Map<Identifier, Socket>();

// export const getSocket = (userId: UUID) => {
//   return socketsByUserId.get(userId);
// };
export const getIo = () => {
  if (!io) throw new Error('referencing io before initialization');
  return io;
};

export const createIO = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: handleCORS,
      methods: ['GET', 'POST']
    },
    pingInterval: 10_000
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  io.use(async (socket, next) => {
    try {
      // const token = socket.handshake.auth.token as unknown;
      // if (!token || !isString(token)) {
      //   throw errors.unauthorized();
      // }
      await Promise.resolve();
      // const user = await authenticateUseCase(token);
      // usersBySocket.set(socket, user);
      // socketsByUserId.set(user.id, socket);
      next();
    } catch (err) {
      next(err as Error);
    }
  });

  const game = createGame();
  game.on('update', snapshot => {
    io.fetchSockets()
      .then(sockets => {
        sockets.forEach(socket => {
          socket.emit('update', {
            players: snapshot.players,
            fieldOFView: snapshot.fieldOfView[socket.id]
          });
        });
      })
      .catch(console.log);
  });

  io.on('connection', socket => {
    game.createPlayer(socket.id);
    socket.emit('map', game.map);

    socket.on('disconnect', () => {
      game.removePlayer(socket.id);
    });

    socket.on('move', (directions: Directions) => {
      game.schedule({
        type: 'move',
        payload: { playerId: socket.id, directions }
      });
    });
  });

  return io;
};
