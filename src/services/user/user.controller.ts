import { NextFunction, Request, Response, Router } from "express";
import Controller from '../../interfaces/controller.interface';
import RequestWithUser from "../../interfaces/request.interface";
import authenticationMiddleware from '../../middleware/authentication.middleware';
import validationMiddleware from '../../middleware/validation.middleware';

import UserDao from "./user.dao";
import CreateUserDto from "./user.dto";

/**
 * Handles User routes for RESTful interface
 */
class UserController implements Controller {
  public path: string = "/users";
  public router: Router = Router();
  private userDao: UserDao = new UserDao();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware, this.all);
    this.router.get(`${this.path}/:id`, authenticationMiddleware, this.one);
    this.router
      .all(`${this.path}/*`, authenticationMiddleware)
      .post(this.path, authenticationMiddleware, validationMiddleware(CreateUserDto), this.save)
      .put(`${this.path}/:id`, validationMiddleware(CreateUserDto, true), this.save)
      .delete(`${this.path}/:id`, this.remove)
  }

  private all = async (request: RequestWithUser, response: Response, next: NextFunction) => {    
    try {
      response.send(await this.userDao.getAll(request.user));
    } catch (error) {
      next(error);
    }
  }

  private one = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      response.send(await this.userDao.getOne(request.user, id));
    } catch (error) {
      next(error);
    }
  }

  private save = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const newRecord: CreateUserDto = request.body;

    try {
      response.send(await this.userDao.save(request.user, newRecord));
    } catch (error) {
      next(error);
    }
  }

  private remove = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;    

    try {
      response.send(await this.userDao.remove(request.user, id));
    } catch (error) {
      next(error);
    }
  }

}

export default UserController;
