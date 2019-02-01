import { NextFunction, Request, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import RequestWithUser from "../../interfaces/request.interface";
import authenticationMiddleware from "../../middleware/authentication.middleware";
import validationMiddleware from "../../middleware/validation.middleware";

import FlagDao from "./flag.dao";
import CreateFlagDto from "./flag.dto";

/**
 * Handles Flag routes for RESTful interface
 */
class FlagController implements Controller {
  public path: string = "/flags";
  public router: Router = Router();
  private flagDao: FlagDao = new FlagDao();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware, this.all);
    this.router.get(`${this.path}/:id`, authenticationMiddleware, this.one);
    this.router
      .all(`${this.path}/*`, authenticationMiddleware)
      .post(this.path, authenticationMiddleware, validationMiddleware(CreateFlagDto), this.save)
      .put(`${this.path}/:id`, validationMiddleware(CreateFlagDto, true), this.save)
      .delete(`${this.path}/:id`, this.remove);
  }

  private all = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      response.send(await this.flagDao.getAll(request.user));
    } catch (error) {
      next(error);
    }
  }

  private one = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      response.send(await this.flagDao.getOne(request.user, id));
    } catch (error) {
      next(error);
    }
  }

  private save = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const newRecord: CreateFlagDto = request.body;

    try {
      response.send(await this.flagDao.save(request.user, newRecord));
    } catch (error) {
      next(error);
    }
  }

  private remove = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      response.send(await this.flagDao.remove(request.user, id));
    } catch (error) {
      next(error);
    }
  }

}

export default FlagController;
