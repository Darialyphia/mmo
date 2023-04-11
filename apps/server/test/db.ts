import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo: MongoMemoryServer;

export const connect = async () => {
  mongo = await MongoMemoryServer.create({
    binary: {
      version: '6.0.0'
      // downloadDir:
      //   'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu1804-6.0.0.tgz'
    }
  });
  const uri = mongo.getUri();
  await mongoose.connect(uri);
};

export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
};

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};
