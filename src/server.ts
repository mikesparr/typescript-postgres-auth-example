/**
 * Main application file that is started from command line
 * Optional: uncomment the createTestData line (once) to create test data
 * Optional: start with 'npm run dev' to add watch and tsc compile on file change
 */
import "./config"; // initiate dot env configs, etc.

import { createConnection } from "typeorm";
import App from "./app";
import rdbms from "./config/rdbms"; // config file for typeorm
import logger from "./config/logger"; // console logger using winston
import controllers from "./services";
import { validateEnv } from "./utils/validation.helper";

validateEnv();

process.on("uncaughtException", (e) => {
  logger.error(e);
  process.exit(1);
});
process.on("unhandledRejection", (e) => {
  logger.error(e);
  process.exit(1);
});

(async () => {
  let connection: any;
  try {
    connection = await createConnection(rdbms);
    logger.info("Database connected");
  } catch (error) {
    logger.error("Error while connecting to the database", error);
    process.exit(1);
  }

  const app = new App(controllers.map((controller) => new controller()));
  app.listen();
})();
