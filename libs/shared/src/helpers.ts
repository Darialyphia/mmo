import { z, type AnyZodObject } from 'zod';
import { PaginatedResponse } from './dtos';

export const clamp = (num: number, min: number, max: number) =>
  Math.min(Math.max(num, min), max);

export const createPaginatedResponse = <T extends AnyZodObject>(shape: T) => {
  return PaginatedResponse.extend({
    items: z.array(shape)
  });
};

export const random = (max: number) => Math.random() * max;

export const randomInt = (max: number) => Math.round(random(max));
