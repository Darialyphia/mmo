import morgan from 'morgan';
import { logger } from '../utils/logger';

export const httpLoggerMiddleware = () =>
  morgan('dev', { stream: { write: message => logger.http(message) } });
