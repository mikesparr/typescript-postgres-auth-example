import { NextFunction, Request, Response } from "express";
import HttpException from "../exceptions/HttpException";

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
  response
    .status(status)
    .send({
      message,
      status,
    });
};

export default errorMiddleware;
