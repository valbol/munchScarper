import axios from "axios";
import robotsParser from "robots-parser";
import { logger } from "../logger";

export const canCrawl = async (url: string): Promise<boolean | undefined> => {
  const { origin } = new URL(url);
  let robotsTxt = "";

  try {
    const res = await axios.get(`${origin}/robots.txt`);
    robotsTxt = res.data;
  } catch (err) {
    logger.warn({ url }, "Could not fetch robots.txt, proceeding by default");
  }

  const robots = robotsParser(`${origin}/robots.txt`, robotsTxt);
  return robots.isAllowed(url, "ValScraperBot/1.0");
};
