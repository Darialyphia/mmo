import dotenv from 'dotenv';
import { closeDatabase, connect } from './db';
dotenv.config();

// This force the download of the mongo binary used by mongo-memory-server the veru first time we run the test on a machine
// This allows us to avoid doing it in a test beforeAll() which would most likely result in a timeout
// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async function preloadMongoBinary() {
  await connect();
  await closeDatabase();
})();
