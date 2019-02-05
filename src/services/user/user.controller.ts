import { NextFunction, Request, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import RequestWithUser from "../../interfaces/request.interface";
import authenticationMiddleware from "../../middleware/authentication.middleware";
import validationMiddleware from "../../middleware/validation.middleware";

import UserDao from "./user.dao";
import CreateUserDto from "./user.dto";
import AddRoleDto from "../role/addrole.dto";

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
    this.router.get(`${this.path}/:id/flags`, authenticationMiddleware, this.getFlags);
    this.router.get(`${this.path}/:id/roles`, authenticationMiddleware, this.getRoles);
    this.router.get(`${this.path}/:id/tokens`, authenticationMiddleware, this.getTokens);
    this.router
      .all(`${this.path}/*`, authenticationMiddleware)
      .post(this.path, authenticationMiddleware, validationMiddleware(CreateUserDto), this.save)
      .post(`${this.path}/:id/roles`, validationMiddleware(AddRoleDto), this.addRole)
      .put(`${this.path}/:id`, validationMiddleware(CreateUserDto, true), this.save)
      .delete(`${this.path}/:id`, this.remove)
      .delete(`${this.path}/:id/tokens`, this.removeAllTokens)
      .delete(`${this.path}/:id/tokens/:tokenId`, this.removeToken)
      .delete(`${this.path}/:id/roles/:roleId`, this.removeRole);
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

  private getFlags = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params; // id of user to get flags for

    try {
      response.send(await this.userDao.getFlags(request.user, id));
    } catch (error) {
      next(error);
    }
  }

  private getTokens = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params; // id of user to get tokens for

    try {
      response.send(await this.userDao.getTokens(request.user, id));
    } catch (error) {
      next(error);
    }
  }

  private removeToken = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id, tokenId } = request.params;

    try {
      response.send(await this.userDao.removeToken(request.user, id, tokenId));
    } catch (error) {
      next(error);
    }
  }

  private removeAllTokens = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      response.send(await this.userDao.removeAllTokens(request.user, id));
    } catch (error) {
      next(error);
    }
  }

  private addRole = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params; // id of user to add roles for
    const newRecord: AddRoleDto = request.body;

    try {
      response.send(await this.userDao.addRole(request.user, id, newRecord));
    } catch (error) {
      next(error);
    }
  }

  private getRoles = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params; // id of user to get roles for

    try {
      response.send(await this.userDao.getRoles(request.user, id));
    } catch (error) {
      next(error);
    }
  }

  private removeRole = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id, roleId } = request.params;

    try {
      response.send(await this.userDao.removeRole(request.user, id, roleId));
    } catch (error) {
      next(error);
    }
  }

}

export default UserController;
