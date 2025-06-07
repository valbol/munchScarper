import { Router } from "express";
import { scrapeController } from "../controllers/scrapeController";
import { rateLimiter } from "../middleware/rateLimiter";
import { validateUrl } from "../middleware/validation";

const router = Router();
router.use(rateLimiter);
router.post("/", validateUrl, scrapeController);

export default router;
