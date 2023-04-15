import { Server } from 'socket.io';
import type http from 'http';
import { handleCORS } from './middlewares/cors';
import { Directions, createGame } from '@mmo/game-engine';

let io: Server;

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

  game.on('update', async snapshot => {
    const sockets = await io.fetchSockets();
    sockets.forEach(socket => {
      socket.emit('update', {
        players: snapshot.players,
        fieldOfView: snapshot.fieldOfView[socket.id]
      });
    });
  });

  io.on('connection', socket => {
    if (!game.isRunning) {
      game.start();
    }

    game.schedule({
      type: 'player joined',
      payload: { playerId: socket.id }
    });

    socket.emit('game-meta', game.meta);

    socket.on('disconnect', async () => {
      game.schedule({
        type: 'player left',
        payload: { playerId: socket.id }
      });

      const sockets = await io.fetchSockets();
      if (!sockets.length) {
        game.stop();
      }
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
