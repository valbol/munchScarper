// src/services/scrapeService.ts
import { Queue, Worker, Job } from "bullmq";
import { scraper } from "../utils/scraper";
import { canCrawl } from "../utils/robots";
import CircuitBreaker from "opossum";
import { config } from "../config";
import IORedis from "ioredis";
import { logger } from "../logger";
import { EventEmitter } from "events";
import { CrawlingDisallowedError } from "../utils/errors";
import { MongoClient } from "mongodb";
import { connectMongo, redisConnection } from "../infrastructure/connections";

// Event emitter for SSE
export const jobEvents = new EventEmitter();
const scrapeQueue = new Queue("scrape", { connection: redisConnection });

const breakerOptions = {
  timeout: 10000,
  errorThresholdPercentage: 100,
  resetTimeout: 30000,
  rollingCountTimeout: 10000,
  volumeThreshold: 1,
};

const breaker = new CircuitBreaker(scraper, breakerOptions)
  .on("open", () => logger.warn("Circuit breaker opened"))
  .on("halfOpen", () => logger.info("Circuit breaker half-open"))
  .on("close", () => logger.info("Circuit breaker closed"));
breaker.fallback(scraper);

export const enqueueScrape = async (
  url: string
): Promise<string | undefined> => {
  logger.info({ url }, "Enqueueing scrape job");
  if (!(await canCrawl(url))) {
    // Enqueue a URL for scraping, respecting robots.txt
    logger.warn({ url }, "Crawling disallowed by robots.txt");
    throw new CrawlingDisallowedError(url);
  }
  const job = await scrapeQueue.add(
    "job",
    { url },
    { attempts: 5, backoff: { type: "exponential", delay: 1000 } }
  );
  logger.info({ url, jobId: job.id }, "Scrape job queued successfully");
  jobEvents.emit("queued", { jobId: job?.id?.toString(), url });
  return job?.id?.toString();
};

// Initialize and start worker, persisting results to MongoDB
export const initWorker = async (): Promise<void> => {
  const db = await connectMongo();
  const collection = db.collection("summaries");

  const worker = new Worker(
    "scrape",
    async (job: Job) => {
      const { url } = job.data;
      jobEvents.emit("started", { jobId: job?.id?.toString(), url });
      try {
        const summary = await breaker.fire(url);
        await collection.insertOne({
          jobId: job?.id?.toString(),
          url,
          summary,
          timestamp: new Date(),
        });
        jobEvents.emit("completed", {
          jobId: job?.id?.toString(),
          url,
          summary,
        });
        logger.info(
          { jobId: job?.id?.toString(), url },
          "Scrape job completed and saved"
        );
        return summary;
      } catch (err: any) {
        jobEvents.emit("failed", {
          jobId: job?.id?.toString(),
          url,
          error: err.message,
        });
        logger.error({ jobId: job?.id?.toString(), err }, "Scrape job failed");
        throw err;
      }
    },
    { connection: redisConnection, concurrency: 5 }
  );

  worker.on("failed", (job, err) => {
    jobEvents.emit("failed", {
      jobId: job?.id?.toString(),
      url: job?.data.url,
      error: err.message,
    });
    logger.error(
      { jobId: job?.id?.toString(), url: job?.data.url, err },
      "Scrape job failed"
    );
  });
};
