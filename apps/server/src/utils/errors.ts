import { HTTP_STATUS_CODES, HttpStatusCode } from './constants';
import { AnyObject, Nullable } from '@mmo/shared';

class AppError extends Error {
  isAppError = true;

  constructor(
    public message: string,
    public statusCode: HttpStatusCode,
    public meta: Nullable<AnyObject>
  ) {
    super(message);
  }
}

export const isAppError = (x: unknown): x is AppError => {
  return x instanceof AppError;
};

export const createAppError =
  (statusCode: HttpStatusCode, defaultMessage: string) =>
  ({ meta, message }: { meta?: object; message?: string } = {}) =>
    new AppError(message ?? defaultMessage, statusCode, meta);

export const errors = {
  unprocessable: createAppError(
    HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY,
    'Unprocessable Entity'
  ),
  unauthorized: createAppError(HTTP_STATUS_CODES.UNAUTHORIZED, 'Unauthorized'),
  badRequest: createAppError(HTTP_STATUS_CODES.BAD_REQUEST, 'Bad request'),
  unexpected: createAppError(
    HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
    'Internal Server error'
  ),
  forbidden: createAppError(HTTP_STATUS_CODES.FORBIDDEN, 'Forbidden'),
  notFound: createAppError(HTTP_STATUS_CODES.NOT_FOUND, 'Not found'),
  tooManyRequests: createAppError(
    HTTP_STATUS_CODES.TOO_MANY_REQUESTS,
    'Too many requests'
  )
};
