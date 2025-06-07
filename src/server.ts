import app from "./app";
import { config } from "./config";
import { initWorker } from "./services/scrapeService";

async function bootstrap() {
  await initWorker();
  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}

bootstrap();
