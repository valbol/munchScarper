import { Request, Response, NextFunction } from "express";
import { enqueueScrape } from "../services/scrapeService";
import { logger } from "../logger";

export const scrapeController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { url } = req.body;
    await enqueueScrape(url);
    res.status(202).json({ message: "Scrape job queued" });
  } catch (err) {
    logger.error(err);
    next(err);
  }
};
