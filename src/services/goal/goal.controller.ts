import { NextFunction, Request, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import RequestWithUser from "../../interfaces/request.interface";
import authenticationMiddleware from "../../middleware/authentication.middleware";
import validationMiddleware from "../../middleware/validation.middleware";

import GoalDao from "./goal.dao";
import CreateGoalDto from "./goal.dto";

/**
 * Handles Goal routes for RESTful interface
 */
class GoalController implements Controller {
  public path: string = "/goals";
  public router: Router = Router();
  private goalDao: GoalDao = new GoalDao();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware, this.all);
    this.router.get(`${this.path}/:id`, authenticationMiddleware, this.one);
    this.router
      .all(`${this.path}/*`, authenticationMiddleware)
      .post(this.path, authenticationMiddleware, validationMiddleware(CreateGoalDto), this.save)
      .put(`${this.path}/:id`, validationMiddleware(CreateGoalDto, true), this.save)
      .delete(`${this.path}/:id`, this.remove);
  }

  private all = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      response.send(await this.goalDao.getAll(request.user));
    } catch (error) {
      next(error);
    }
  }

  private one = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      response.send(await this.goalDao.getOne(request.user, id));
    } catch (error) {
      next(error);
    }
  }

  private save = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const newRecord: CreateGoalDto = request.body;

    try {
      response.send(await this.goalDao.save(request.user, newRecord));
    } catch (error) {
      next(error);
    }
  }

  private remove = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      response.send(await this.goalDao.remove(request.user, id));
    } catch (error) {
      next(error);
    }
  }

}

export default GoalController;
