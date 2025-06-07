import dotenv from "dotenv";

dotenv.config();

const requiredEnvs = [
  "PORT",
  "REDIS_URL",
  "MONGO_URL",
  "IMPORT_URL",
  "RATE_LIMIT_WINDOW_MS",
  "RATE_LIMIT_MAX",
  "REDIS_DEDUPE_TTL",
  "LOG_LEVEL",
];

requiredEnvs.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing env var ${key}`);
  }
});

export const config = {
  port: Number(process.env.PORT),
  redisUrl: process.env.REDIS_URL!,
  mongoUrl: process.env.MONGO_URL!,
  importUrl: process.env.IMPORT_URL!,
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX),
  redisDedupeTtl: Number(process.env.REDIS_DEDUPE_TTL),
  logLevel: process.env.LOG_LEVEL!,
};
