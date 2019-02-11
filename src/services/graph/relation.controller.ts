import { NextFunction, Request, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import RequestWithUser from "../../interfaces/request.interface";
import addSearchParams from "../../middleware/search.middleware";
import authenticationMiddleware from "../../middleware/authentication.middleware";
import validationMiddleware from "../../middleware/validation.middleware";
import { Formatter } from "../../utils/formatter";

import RelationDao from "./relation.dao";
import CreateRelationDto from "./relation.dto";

/**
 * Handles Relation routes for RESTful interface
 */
class RelationController implements Controller {
  public path: string = "/relations";
  public router: Router = Router();

  private fmt: Formatter = new Formatter();
  private relationDao: RelationDao = new RelationDao();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware, addSearchParams, this.all);
    this.router
      .all(`${this.path}/*`, authenticationMiddleware)
      .post(this.path, authenticationMiddleware, validationMiddleware(CreateRelationDto, true), this.save)
      .delete(`${this.path}/:id`, this.remove);
  }

  private all = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      const {data, total} = await this.relationDao.getAll(request.user, request.params);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK", total));
    } catch (error) {
      next(error);
    }
  }

  private save = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const newRecord: CreateRelationDto = request.body;

    try {
      const data: any = await this.relationDao.save(request.user, newRecord);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  private remove = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      const data: any = await this.relationDao.remove(request.user, id);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

}

export default RelationController;
