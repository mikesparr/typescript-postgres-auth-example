import dotenv from "dotenv";
dotenv.config();

import "reflect-metadata";
import { createConnection } from "typeorm";
import rdbms from "./config/rdbms";
import {User} from "./services/user/user.entity";

import express from "express";
import http from "http";
import middleware from "./middleware";
import errorHandlers from "./middleware/errorHandlers";
import routes from "./services";
import { applyMiddleware, applyRoutes } from "./utils";

process.on("uncaughtException", (e) => {
  /* tslint:disable-next-line */
  console.error(e);
  process.exit(1);
});
process.on("unhandledRejection", (e) => {
  /* tslint:disable-next-line */
  console.error(e);
  process.exit(1);
});

createConnection(rdbms).then(async (connection) => {

  const router = express();
  applyMiddleware(middleware, router);
  applyRoutes(routes, router);
  applyMiddleware(errorHandlers, router);

  const { PORT = 3000 } = process.env || {};
  const server = http.createServer(router);

  server.listen(PORT, () => {
    /* tslint:disable-next-line */
    console.log(`Server is running http://localhost:${PORT}...`);
  });

  // TODO: (remove me) insert new users for test
  await connection.manager.save(connection.manager.create(User, {
    age: 27,
    firstName: "Timber",
    lastName: "Saw",
  }));
  await connection.manager.save(connection.manager.create(User, {
    age: 24,
    firstName: "Phantom",
    lastName: "Assassin",
  }));

});
