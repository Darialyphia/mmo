// import dotenv from 'dotenv';
// dotenv.config();
import http from 'http';
import { config } from '@/config';
import { createApp } from '@/app';
import { logger } from '@/utils/logger';
import mongoose from 'mongoose';
import { createIO } from './io';

// eslint-disable-next-line @typescript-eslint/require-await
const main = async () => {
  logger.info(`Starting app in ${config.NODE_ENV} mode.`);
  const app = createApp();
  const server = http.createServer(app);
  createIO(server);
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.DATABASE_URI);
  logger.info(`Connecting to the database at ${config.DATABASE_URI}`);
  logger.info('Database connection OK');

  server.listen(config.PORT, () => {
    logger.info(`Server ready on port ${config.PORT}`);
  });
};

main().catch(err => {
  console.log(err.stack);
  process.exit(-1);
});
