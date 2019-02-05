import { NextFunction, Request, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import RequestWithUser from "../../interfaces/request.interface";
import authenticationMiddleware from "../../middleware/authentication.middleware";
import validationMiddleware from "../../middleware/validation.middleware";

import RoleDao from "./role.dao";
import CreateRoleDto from "./role.dto";
import PermissionDto from "../permission/permission.dto";

/**
 * Handles Role routes for RESTful interface
 */
class RoleController implements Controller {
  public path: string = "/roles";
  public router: Router = Router();
  private roleDao: RoleDao = new RoleDao();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware, this.all);
    this.router.get(`${this.path}/:id`, authenticationMiddleware, this.one);
    this.router.get(`${this.path}/:id/permissions`, authenticationMiddleware, this.getPermissions);
    this.router
      .all(`${this.path}/*`, authenticationMiddleware)
      .post(this.path, authenticationMiddleware, validationMiddleware(CreateRoleDto), this.save)
      .post(`${this.path}/:id/permissions`, validationMiddleware(PermissionDto), this.addPermission)
      .put(`${this.path}/:id`, validationMiddleware(CreateRoleDto, true), this.save)
      .delete(`${this.path}/:id/permissions/:permissionId`, this.removePermission)
      .delete(`${this.path}/:id`, this.remove);
  }

  private all = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      response.send(await this.roleDao.getAll(request.user));
    } catch (error) {
      next(error);
    }
  }

  private one = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      response.send(await this.roleDao.getOne(request.user, id));
    } catch (error) {
      next(error);
    }
  }

  private save = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const newRecord: CreateRoleDto = request.body;

    try {
      response.send(await this.roleDao.save(request.user, newRecord));
    } catch (error) {
      next(error);
    }
  }

  private remove = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      response.send(await this.roleDao.remove(request.user, id));
    } catch (error) {
      next(error);
    }
  }

  private addPermission = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params; // id of role to add permissions for
    const newRecord: PermissionDto = request.body;

    try {
      response.send(await this.roleDao.addPermission(request.user, id, newRecord));
    } catch (error) {
      next(error);
    }
  }

  private getPermissions = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params; // id of role to get permissions for

    try {
      response.send(await this.roleDao.getPermissions(request.user, id));
    } catch (error) {
      next(error);
    }
  }

  private removePermission = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id, roleId } = request.params;

    try {
      response.send(await this.roleDao.removePermission(request.user, id, roleId));
    } catch (error) {
      next(error);
    }
  }

}

export default RoleController;
