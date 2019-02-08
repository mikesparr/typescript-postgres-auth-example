import { NextFunction, Request, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import RequestWithUser from "../../interfaces/request.interface";
import URLParams from "../../interfaces/urlparams.interface";
import authenticationMiddleware from "../../middleware/authentication.middleware";
import validationMiddleware from "../../middleware/validation.middleware";
import { Formatter } from "../../utils/formatter";

import EventDao from "./event.dao";

/**
 * Handles Event routes for RESTful interface
 */
class EventController implements Controller {
  public path: string = "/events";
  public router: Router = Router();

  private fmt: Formatter = new Formatter();
  private eventDao: EventDao = new EventDao();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware, this.all);
  }

  private all = async (request: RequestWithUser, response: Response, next: NextFunction) => {
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

    try {
      const data: any = await this.eventDao.getAll(request.user, params);
      response.send(this.fmt.formatResponse(data, 0, "OK"));
    } catch (error) {
      next(error);
    }
  }
}

export default EventController;
