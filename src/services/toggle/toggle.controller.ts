import { NextFunction, Request, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import RequestWithUser from "../../interfaces/request.interface";
import authenticationMiddleware from "../../middleware/authentication.middleware";
import validationMiddleware from "../../middleware/validation.middleware";

import ToggleDao from "./toggle.dao";
import CreateToggleDto from "./toggle.dto";

/**
 * Handles Toggle routes for RESTful interface
 */
class ToggleController implements Controller {
  public path: string = "/toggles";
  public router: Router = Router();
  private toggleDao: ToggleDao = new ToggleDao();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware, this.all);
    this.router.get(`${this.path}/:id`, authenticationMiddleware, this.one);
    this.router
      .all(`${this.path}/*`, authenticationMiddleware)
      .post(this.path, authenticationMiddleware, validationMiddleware(CreateToggleDto), this.save)
      .put(`${this.path}/:id`, validationMiddleware(CreateToggleDto, true), this.save)
      .delete(`${this.path}/:id`, this.remove);
  }

  private all = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      response.send(await this.toggleDao.getAll(request.user));
    } catch (error) {
      next(error);
    }
  }

  private one = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      response.send(await this.toggleDao.getOne(request.user, id));
    } catch (error) {
      next(error);
    }
  }

  private save = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const newRecord: CreateToggleDto = request.body;

    try {
      response.send(await this.toggleDao.save(request.user, newRecord));
    } catch (error) {
      next(error);
    }
  }

  private remove = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      response.send(await this.toggleDao.remove(request.user, id));
    } catch (error) {
      next(error);
    }
  }

}

export default ToggleController;
