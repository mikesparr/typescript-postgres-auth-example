import dotenv from "dotenv";
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

dotenv.config();

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
