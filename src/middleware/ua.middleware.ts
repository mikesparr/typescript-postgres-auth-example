import { NextFunction, Request, Response } from "express";
import RequestWithUser from "../interfaces/request.interface";
import UAParser from "ua-parser-js";
import logger from "../config/logger";

/**
 * Parse user agent data from header and add to Request
 * @param request
 * @param response
 * @param next
 */
const addUserAgent = (request: RequestWithUser, response: Response, next: NextFunction) => {
  try {
    request.userAgent = new UAParser(request.headers["user-agent"]).getResult();
    next();
  } catch (error) {
    logger.warn(`Could not determine user agent`);
    next();
  }
};

export default addUserAgent;
