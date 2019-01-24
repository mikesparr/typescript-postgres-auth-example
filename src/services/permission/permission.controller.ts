import { NextFunction, Request, Response, Router } from "express";
import { getRepository, Repository } from "typeorm";
import { Permission } from "./permission.entity";
import Controller from '../../interfaces/controller.interface';
import CreatePermissionDto from "./permission.dto";
import RecordNotFoundException from '../../exceptions/RecordNotFoundException';
import authenticationMiddleware from '../../middleware/authentication.middleware';
import validationMiddleware from '../../middleware/validation.middleware';

/**
 * Handles CRUD operations on Permission data in database
 */
class PermissionController implements Controller {
  public path: string = "/permissions";
  public router: Router = Router();
  private permissionRepository: Repository<Permission> = getRepository(Permission);

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware, this.all);
    this.router.get(`${this.path}/:id`, authenticationMiddleware, this.one);
    this.router
      .all(`${this.path}/*`, authenticationMiddleware)
      .post(this.path, authenticationMiddleware, validationMiddleware(CreatePermissionDto), this.save)
      .put(`${this.path}/:id`, validationMiddleware(CreatePermissionDto, true), this.save)
      .delete(`${this.path}/:id`, this.remove)
  }

  private all = async (request: Request, response: Response, next: NextFunction) => {
    const permissions = await this.permissionRepository.find();
    response.send(permissions);
  }

  private one = async (request: Request, response: Response, next: NextFunction) => {
    const { id } = request.params;
    const permission = await this.permissionRepository.findOne(id);
    if (permission) {
      response.send(permission);
    } else {
      next(new RecordNotFoundException(id));
    }
  }

  private save = async (request: Request, response: Response, next: NextFunction) => {
    const permissionData: CreatePermissionDto = request.body;
    await this.permissionRepository.save(permissionData);
    response.send(permissionData);
  }

  private remove = async (request: Request, response: Response, next: NextFunction) => {
    const { id } = request.params;
    const permissionToRemove = await this.permissionRepository.findOne(id);
    if (permissionToRemove) {
      await this.permissionRepository.remove(permissionToRemove);
      response.send(200);
    } else {
      next(new RecordNotFoundException(id));
    }
  }

}

export default PermissionController;
