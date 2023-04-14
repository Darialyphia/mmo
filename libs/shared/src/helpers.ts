import { z, type AnyZodObject } from 'zod';
import { PaginatedResponse } from './dtos';
import type { Point, Size } from './types/geometry';
import type { Matrix } from './types/utils';

export const clamp = (num: number, min: number, max: number) =>
  Math.min(Math.max(num, min), max);

export const createPaginatedResponse = <T extends AnyZodObject>(shape: T) => {
  return PaginatedResponse.extend({
    items: z.array(shape)
  });
};

export const random = (max: number) => Math.random() * max;

export const randomInt = (max: number) => Math.round(random(max));

export const createMatrix = <T>(
  dimensions: Size,
  initialValue: (point: Point) => T
): Matrix<T> =>
  Array.from({ length: dimensions.w }, (_, x) =>
    Array.from({ length: dimensions.h }, (_, y) => initialValue({ x, y }))
  );
