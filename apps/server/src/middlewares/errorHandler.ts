import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@mmo/shared';
import { isAppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const normalizedError: ApiError = isAppError(err)
    ? { ...err }
    : {
        message: config.IS_DEV ? (err as Error).message : 'Unexpected error',
        statusCode: 500,
        meta: undefined
      };

  logger.error(err);
  const shouldLogStackTrace =
    config.IS_DEV && !isAppError(err) && err instanceof Error;
  if (shouldLogStackTrace) {
    console.log(err.stack);
  }

  res.status(normalizedError.statusCode).send(normalizedError);
};
