import { Values } from '@mmo/shared';

export const HTTP_STATUS_CODES = {
  UNPROCESSABLE_ENTITY: 422,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429
} as const;
export type HttpStatusCode = Values<typeof HTTP_STATUS_CODES>;
