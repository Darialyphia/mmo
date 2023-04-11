import type { AnyFunction, Nullable } from '@mmo/shared';
import cors from 'cors';
import { config } from '../config';

export const handleCORS = (origin: Nullable<string>, callback: AnyFunction) => {
  if (!origin || config.CORS.ALLOWED_ORIGINS.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('CORS'));
  }
};

export const corsMiddleware = () =>
  cors({
    credentials: true,
    origin: handleCORS
  });
