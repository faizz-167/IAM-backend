import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";

const app = createApp();

app.listen(env.port, () => {
  logger.info(
    `Server is running on port http://localhost:${env.port} in ${env.nodeEnv} mode`,
  );
});
