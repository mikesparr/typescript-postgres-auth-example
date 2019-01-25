import { NextFunction, Request, Response, Router } from "express";
import { getRepository, Repository } from "typeorm";
import AuthPermission from '../../interfaces/permission.interface';
import Controller from '../../interfaces/controller.interface';
import RequestWithUser from "../../interfaces/request.interface";
import RecordNotFoundException from '../../exceptions/RecordNotFoundException';
import RecordsNotFoundException from '../../exceptions/RecordsNotFoundException';
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import authenticationMiddleware from '../../middleware/authentication.middleware';
import validationMiddleware from '../../middleware/validation.middleware';
import { methodActions, getPermission } from "../../utils/authorization.helper";

import { Role } from "./role.entity";
import CreateRoleDto from "./role.dto";

/**
 * Handles CRUD operations on Role data in database
 */
class RoleController implements Controller {
  public path: string = "/roles";
  public router: Router = Router();
  private resource: string = "role";
  private roleRepository: Repository<Role> = getRepository(Role);

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware, this.all);
    this.router.get(`${this.path}/:id`, authenticationMiddleware, this.one);
    this.router
      .all(`${this.path}/*`, authenticationMiddleware)
      .post(this.path, authenticationMiddleware, validationMiddleware(CreateRoleDto), this.save)
      .put(`${this.path}/:id`, validationMiddleware(CreateRoleDto, true), this.save)
      .delete(`${this.path}/:id`, this.remove)
  }

  private all = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const roles = await this.roleRepository.find({ relations: ["permissions"] });
    
    const isOwnerOrMember: boolean = false;
    const action: string = methodActions[request.method];
    const permission: AuthPermission = await getPermission(request.user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (!roles) {
        next(new RecordsNotFoundException(this.resource));
      } else {
        response.send(permission.filter(roles));
      }
    } else {
      next(new UserNotAuthorizedException(request.user.id, action, this.resource));
    }
  }

  private one = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;
    const role = await this.roleRepository.findOne(id, { relations: ["permissions"] });

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions[request.method];
    const permission: AuthPermission = await getPermission(request.user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (!role) {
        next(new RecordNotFoundException(id));
      } else {
        response.send(permission.filter(role));
      }
    } else {
      next(new UserNotAuthorizedException(request.user.id, action, this.resource));
    }
  }

  private save = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const roleData: CreateRoleDto = request.body;

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions[request.method];
    const permission: AuthPermission = await getPermission(request.user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const filteredData: CreateRoleDto = permission.filter(roleData);
      await this.roleRepository.save(filteredData);
      response.send(filteredData);
    } else {
      next(new UserNotAuthorizedException(request.user.id, action, this.resource));
    }
  }

  private remove = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;    
    const roleToRemove = await this.roleRepository.findOne(id);

    const isOwnerOrMember: boolean = request.user.id === id;
    const action: string = methodActions[request.method];
    const permission: AuthPermission = await getPermission(request.user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (roleToRemove) {
        await this.roleRepository.remove(roleToRemove);
        response.send(200);
      } else {
        next(new RecordNotFoundException(id));
      }
    } else {
      next(new UserNotAuthorizedException(request.user.id, action, this.resource));
    }
  }

}

export default RoleController;
