import "./config"; // initiate dot env configs, etc.

import { createConnection } from "typeorm";
import App from "./app";
import rdbms from "./config/rdbms"; // config file for typeorm
import logger from "./config/logger"; // console logger using winston
import controllers from "./services";
import validateEnv from "./utils/env.validator";

import createTestData from "./config/data.test";

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
  } catch (error) {
    logger.error("Error while connecting to the database", error);
    return error;
  }

  const app = new App(controllers.map((controller) => new controller()));
  app.listen();

  // TODO: remove me after test - insert new users for test
  // await createTestData(connection);
  // end remove me
})();
