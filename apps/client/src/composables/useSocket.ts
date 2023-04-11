import io from 'socket.io-client';
import { config } from '@/config';
import type { AnyFunction } from '@mmo/shared';

export const useSocket = () => {
  return io(config.API_URL, {
    autoConnect: false,
    transports: ['websocket']
  });
};

export const useSocketEvent = (eventName: string, cb: AnyFunction) => {
  const socket = useSocket();

  socket.on(eventName, cb as any);

  onUnmounted(() => {
    socket.off(eventName, cb as any);
  });
};
