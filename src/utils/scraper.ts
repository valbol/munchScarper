import { Summary } from "../types/summary";
import { logger } from "../logger";
import { getBrowser } from "../infrastructure/browserPool";
import { redisClient } from "../infrastructure/connections";
import { HttpError } from "../utils/errors";
import { log } from "console";

const CACHE_TTL = 3600;
const LOCK_TTL = 30;

export const scraper = async (url: string): Promise<Summary> => {
  const cacheKey = `summary:${url}`;
  const lockKey = `lock:${url}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    logger.info({ url }, "Returning cached summary");
    const ttl = await redisClient.ttl(cacheKey);
    logger.info({ url, ttl }, "Cache TTL remaining (s)");
    return JSON.parse(cached) as Summary;
  }
  logger.info({ url }, "Cache miss – scraping and caching result");
  const gotLock = await redisClient.set(lockKey, "1", "EX", LOCK_TTL, "NX");

  if (!gotLock) {
    logger.info({ url }, "Another process is scraping, waiting for cache");
    // Wait for lock to expire or cache to fill
    await new Promise((resolve) => setTimeout(resolve, LOCK_TTL * 1000));
    const afterWait = await redisClient.get(cacheKey);
    if (afterWait) {
      return JSON.parse(afterWait);
    }
    logger.warn({ url }, "Cache still empty after wait, proceeding to scrape");
  }

  let browser: any;
  let page: any;
  try {
    browser = await getBrowser();
    page = await browser.newPage();
    await page.setUserAgent("ValScraperBot/1.0");
    const response = await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });
    if (!response) throw new HttpError(500, `No response for ${url}`);
    if (response.status() >= 400)
      throw new HttpError(
        response.status(),
        `HTTP ${response.status()} on ${url}`
      );

    // Main extraction
    const data: Summary = await page.evaluate(() => {
      const countWords = (str: string) => str.trim().split(/\s+/).length;
      const title =
        document.querySelector("title")?.textContent?.trim() || "No title";
      const description =
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content")
          ?.trim() || "No description";
      const keywordsMeta = document
        .querySelector('meta[name="keywords"]')
        ?.getAttribute("content");
      const keywords = keywordsMeta
        ? keywordsMeta
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean)
        : undefined;
      const author = document
        .querySelector('meta[name="author"]')
        ?.getAttribute("content")
        ?.trim();
      const publishedAt = document
        .querySelector(
          'meta[property="article:published_time"], meta[name="pubdate"]'
        )
        ?.getAttribute("content");

      const leadParagraphs = Array.from(
        document.querySelectorAll<HTMLParagraphElement>("p")
      )
        .map((p) => p.textContent?.trim() || "")
        .filter((txt) => txt.length > 20)
        .slice(0, 3);
      const totalWords = leadParagraphs.reduce(
        (sum, p) => sum + countWords(p),
        0
      );
      const readTimeMinutes =
        totalWords > 0 ? Math.max(1, Math.ceil(totalWords / 200)) : undefined;

      const h1 = Array.from(
        document.querySelectorAll<HTMLHeadingElement>("h1")
      ).map((h) => h.textContent?.trim() || "");
      const h2 = Array.from(
        document.querySelectorAll<HTMLHeadingElement>("h2")
      ).map((h) => h.textContent?.trim() || "");
      const h3 = Array.from(
        document.querySelectorAll<HTMLHeadingElement>("h3")
      ).map((h) => h.textContent?.trim() || "");

      const topLinks = Array.from(
        document.querySelectorAll<HTMLAnchorElement>("a[href]")
      )
        .map((a) => ({ text: a.textContent?.trim() || "", href: a.href }))
        .filter((l) => l.text.length > 0)
        .slice(0, 5);

      const topImages = Array.from(
        document.querySelectorAll<HTMLImageElement>("img[src]")
      )
        .map((img) => ({ src: img.src, alt: img.alt.trim() }))
        .slice(0, 5);

      return {
        metadata: {
          title,
          description,
          keywords,
          author,
          publishedAt,
          readTimeMinutes,
        },
        headings: { h1, h2, h3 },
        leadParagraphs,
        topLinks,
        topImages,
      };
    });

    await redisClient.set(cacheKey, JSON.stringify(data), "EX", CACHE_TTL);
    return data;
  } catch (err) {
    logger.error({ url, err }, "Error fetching or parsing HTML with Puppeteer");
    throw err;
  } finally {
    await redisClient.del(lockKey);
    if (page) await page.close();
  }
};
