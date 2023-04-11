import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { corsMiddleware } from './middlewares/cors';
import { errorHandler } from './middlewares/errorHandler';
import { errors } from './utils/errors';
import { httpLoggerMiddleware } from './middlewares/httpLogger';
import { createRoute } from './utils/createRoute';
import { parseLayoutMeta } from './mapgen';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(corsMiddleware());

  if (config.IS_PROD) {
    app.use(compression());
  }
  app.use(httpLoggerMiddleware());
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser(config.COOKIE_SECRET));

  app.get(
    '/layout',
    ...createRoute({
      async controller() {
        return parseLayoutMeta();
      }
    })
  );
  app.use(() => {
    throw errors.notFound();
  });
  app.use(errorHandler);

  return app;
};
