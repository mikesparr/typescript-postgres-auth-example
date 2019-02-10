import { NextFunction, Request, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import RequestWithUser from "../../interfaces/request.interface";
import addSearchParams from "../../middleware/search.middleware";
import authenticationMiddleware from "../../middleware/authentication.middleware";
import validationMiddleware from "../../middleware/validation.middleware";
import { Formatter } from "../../utils/formatter";

import UserDao from "./user.dao";
import CreateUserDto from "./user.dto";
import AddRoleDto from "./addrole.dto";

/**
 * Handles User routes for RESTful interface
 */
class UserController implements Controller {
  public path: string = "/users";
  public router: Router = Router();

  private fmt: Formatter = new Formatter();
  private userDao: UserDao = new UserDao();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware, addSearchParams, this.all);
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
      const {data, total} = await this.userDao.getAll(request.user, request.searchParams);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK", total));
    } catch (error) {
      next(error);
    }
  }

  private one = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      const data: any = await this.userDao.getOne(request.user, id);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  private save = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const newRecord: CreateUserDto = request.body;

    try {
      const data: any = await this.userDao.save(request.user, newRecord);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  private remove = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      const data: any = await this.userDao.remove(request.user, id);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  private getFlags = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params; // id of user to get flags for

    try {
      const data: any = await this.userDao.getFlags(request.user, id);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  private getTokens = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params; // id of user to get tokens for

    try {
      const data: any = await this.userDao.getTokens(request.user, id);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  private removeToken = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id, tokenId } = request.params;

    try {
      const data: any = await this.userDao.removeToken(request.user, id, tokenId);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  private removeAllTokens = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      const data: any = await this.userDao.removeAllTokens(request.user, id);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  private addRole = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params; // id of user to add roles for
    const newRecord: AddRoleDto = request.body;

    try {
      const data: any = await this.userDao.addRole(request.user, id, newRecord);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  private getRoles = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params; // id of user to get roles for

    try {
      const data: any = await this.userDao.getRoles(request.user, id);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  private removeRole = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id, roleId } = request.params;

    try {
      const data: any = await this.userDao.removeRole(request.user, id, roleId);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

}

export default UserController;
