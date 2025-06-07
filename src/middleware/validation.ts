import { Request, Response, NextFunction, RequestHandler } from "express";
import { body, validationResult } from "express-validator";
import { logger } from "../logger";

export const validateUrl: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  await body("url").isURL().withMessage("Must provide a valid URL").run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error("validation error", errors);
    res.status(400).json({ errors: errors.array() });
    return; // early return, so Promise resolves void
  }

  next();
};
