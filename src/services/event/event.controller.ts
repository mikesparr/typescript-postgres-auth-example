import { NextFunction, Request, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import RequestWithUser from "../../interfaces/request.interface";
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
    // TODO: handle query params and pagination

    try {
      const data: any = await this.eventDao.getAll(request.user);
      response.send(this.fmt.formatResponse(data, 0, "OK"));
    } catch (error) {
      next(error);
    }
  }
}

export default EventController;
