import rateLimit from "express-rate-limit";
import { config } from "../config";

export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
});
