import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { HttpError } from "../utils/errors";
import { logger } from "../logger";

export const errorHandler: ErrorRequestHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof HttpError || typeof (err as any).statusCode === "number") {
    const status = (err as any).statusCode ?? 500;
    logger.warn(`HTTP ${status} - ${err.message}`);
    res.status(status).json({ error: err.message });
    return;
  }

  logger.error(err);
  res.status(500).json({ error: "Internal Server Error" });
};
