import { NextFunction, Request, Response } from "express";
import RequestWithUser from "../interfaces/request.interface";
import URLParams from "../interfaces/urlparams.interface";
import logger from "../config/logger";

/**
 * Parse user agent data from header and add to Request
 * @param request
 * @param response
 * @param next
 */
const addSearchParams = (request: RequestWithUser, response: Response, next: NextFunction) => {
  try {
    const {q, limit, offset, from, to, sort} = request.query;
    const params: URLParams = {};

    if (q) {
      params.q = q;
    }
    if (limit) {
      params.limit = limit;
    }
    if (offset) {
      params.offset = offset;
    }
    if (from) {
      params.from = from;
    }
    if (to) {
      params.to = to;
    }
    if (sort) {
      params.sort = sort;
    }

    request.searchParams = params;
    next();
  } catch (error) {
    logger.warn(`Could not determine user agent`);
    next();
  }
};

export default addSearchParams;
