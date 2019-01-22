import "./config"; // initiate dot env configs, etc.

import { createConnection } from "typeorm";
import App from "./app";
import rdbms from "./config/rdbms"; // config file for typeorm
import logger from "./config/logger"; // console logger using winston
import routes from "./services";

import {User} from "./services/user/user.entity";

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

  const app = new App(routes);
  app.listen();

  // TODO: remove me after test - insert new users for test
  logger.info("Adding 2 test users to database");
  await connection.manager.save(connection.manager.create(User, {
    firstName: "Timber",
    lastName: "Saw",
    age: 27
  }));
  await connection.manager.save(connection.manager.create(User, {
    firstName: "Phantom",
    lastName: "Assassin",
    age: 24
  }));
  // end remove me
})();
