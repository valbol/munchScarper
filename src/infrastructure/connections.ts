import IORedis from "ioredis";
import { MongoClient } from "mongodb";
import { config } from "../config";
import { logger } from "../logger";

// Redis client for BullMQ
export const redisConnection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

// Alias redisConnection as redisClient
export const redisClient = redisConnection;

export const mongoClient = new MongoClient(config.mongoUrl);
export const connectMongo = async () => {
  await mongoClient.connect();
  logger.info("Connected to MongoDB");
  return mongoClient.db();
};
