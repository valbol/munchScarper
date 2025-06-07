import { Router, Request, Response } from "express";
import { jobEvents } from "../services/scrapeService";

const router = Router();

// SSE endpoint for job status updates
router.get("/", (req: Request, res: Response) => {
  res.writeHead(200, {
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });
  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Subscribe to job events
  const handlers: { [key: string]: any } = {};
  ["queued", "started", "completed", "failed"].forEach((event) => {
    handlers[event] = (payload: any) => sendEvent(event, payload);
    jobEvents.on(event, handlers[event]);
  });

  // Cleanup on client disconnect
  req.on("close", () => {
    Object.keys(handlers).forEach((event) =>
      jobEvents.off(event, handlers[event])
    );
    res.end();
  });
});

export default router;
