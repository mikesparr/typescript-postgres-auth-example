import { NextFunction, Request, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import RequestWithUser from "../../interfaces/request.interface";
import authenticationMiddleware from "../../middleware/authentication.middleware";
import validationMiddleware from "../../middleware/validation.middleware";

import RuleDao from "./rule.dao";
import CreateRuleDto from "./rule.dto";

/**
 * Handles Rule routes for RESTful interface
 */
class RuleController implements Controller {
  public path: string = "/rules";
  public router: Router = Router();
  private ruleDao: RuleDao = new RuleDao();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware, this.all);
    this.router.get(`${this.path}/:id`, authenticationMiddleware, this.one);
    this.router
      .all(`${this.path}/*`, authenticationMiddleware)
      .post(this.path, authenticationMiddleware, validationMiddleware(CreateRuleDto), this.save)
      .put(`${this.path}/:id`, validationMiddleware(CreateRuleDto, true), this.save)
      .delete(`${this.path}/:id`, this.remove);
  }

  private all = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      response.send(await this.ruleDao.getAll(request.user));
    } catch (error) {
      next(error);
    }
  }

  private one = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      response.send(await this.ruleDao.getOne(request.user, id));
    } catch (error) {
      next(error);
    }
  }

  private save = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const newRecord: CreateRuleDto = request.body;

    try {
      response.send(await this.ruleDao.save(request.user, newRecord));
    } catch (error) {
      next(error);
    }
  }

  private remove = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      response.send(await this.ruleDao.remove(request.user, id));
    } catch (error) {
      next(error);
    }
  }

}

export default RuleController;
