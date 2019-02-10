import { NextFunction, Request, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import RequestWithUser from "../../interfaces/request.interface";
import addSearchParams from "../../middleware/search.middleware";
import authenticationMiddleware from "../../middleware/authentication.middleware";
import validationMiddleware from "../../middleware/validation.middleware";
import { Formatter } from "../../utils/formatter";

import GoalDao from "./goal.dao";
import CreateGoalDto from "./goal.dto";

/**
 * Handles Goal routes for RESTful interface
 */
class GoalController implements Controller {
  public path: string = "/goals";
  public router: Router = Router();

  private fmt: Formatter = new Formatter();
  private goalDao: GoalDao = new GoalDao();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware, addSearchParams, this.all);
    this.router.get(`${this.path}/:id`, authenticationMiddleware, this.one);
    this.router
      .all(`${this.path}/*`, authenticationMiddleware)
      .post(this.path, authenticationMiddleware, validationMiddleware(CreateGoalDto), this.save)
      .put(`${this.path}/:id`, validationMiddleware(CreateGoalDto, true), this.save)
      .delete(`${this.path}/:id`, this.remove);
  }

  private all = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      const {data, total} = await this.goalDao.getAll(request.user, request.searchParams);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK", total));
    } catch (error) {
      next(error);
    }
  }

  private one = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      const data: any = await this.goalDao.getOne(request.user, id);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  private save = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const newRecord: CreateGoalDto = request.body;

    try {
      const data: any = await this.goalDao.save(request.user, newRecord);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  private remove = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      const data: any = await this.goalDao.remove(request.user, id);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

}

export default GoalController;
