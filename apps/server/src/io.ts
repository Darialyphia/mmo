import { Server, Socket } from 'socket.io';
import type http from 'http';
import { handleCORS } from './middlewares/cors';
import { Point, clamp, randomInt } from '@mmo/shared';
import { createGame } from './game';
import { nanoid } from 'nanoid';

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
  game.on('update', gameState => {
    io.emit('update', gameState);
  });

  io.on('connection', socket => {
    const user = game.createPlayer();
    usersBySocket.set(socket, user);

    socket.emit('map', game.map);

    socket.on('disconnect', () => {
      const player = usersBySocket.get(socket);
      if (player) {
        game.removePlayer(player);
        usersBySocket.delete(socket);
      }
    });

    socket.on('move', (direction: 'up' | 'down' | 'left' | 'right') => {
      const player = usersBySocket.get(socket);
      if (player) {
        game.movePlayer(player, direction);
      }
    });
  });

  return io;
};
