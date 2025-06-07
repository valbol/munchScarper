import express from "express";
import { json } from "body-parser";
import scrapeRouter from "./routes/scrape";
import eventRouter from "./routes/events";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
app.use(json());
app.use("/scrape", scrapeRouter);
app.use("/events", eventRouter);
app.use(errorHandler);

export default app;
