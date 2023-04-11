import { Values } from '@mmo/shared';
import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';

export const Events = {} as const;
export type Events = Values<typeof Events>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type MessageEvents = {};

export const eventEmitter = new EventEmitter() as TypedEmitter<MessageEvents>;
