import type { AnyObject } from './types/utils';

export type EventQueueMap = Record<string, AnyObject>;
export type EventQueueEvent = {
  type: string;
  payload: any;
};

export type EventQueue<T extends EventQueueEvent> = {
  dispatch: (event: T) => void;
  process: () => void;
};

export const createQueue = <T extends EventQueueEvent>(
  reducer: (event: T, queue: EventQueue<T>) => void
): EventQueue<T> => {
  const events: T[] = [];

  const queue = {
    dispatch(event: T) {
      events.push(event);
    },

    process() {
      let e = events.shift();

      while (e) {
        reducer(e, queue);

        e = events.shift();
      }
    }
  };

  return queue;
};
