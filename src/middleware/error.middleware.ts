import { NextFunction, Request, Response } from "express";
import logger from "../config/logger";
import HttpException from "../exceptions/HttpException";
import { Formatter } from "../utils/formatter";

const fmt: Formatter = new Formatter();

/**
 * Global handler for Errors sending the message and status
 * @param error
 * @param request
 * @param response
 * @param next
 */
const errorMiddleware = (error: HttpException, request: Request, response: Response, next: NextFunction) => {
  const status = error.status || 500;
  const message = error.message || "Something went wrong";

  logger.warn(message); // TODO: consider changing to different level
  response
    .status(status)
    .send(fmt.formatResponse(new HttpException(status, message), 0, message));
};

export default errorMiddleware;
