import { NextFunction, Request, Response, Router } from "express";
import { getRepository, Repository } from "typeorm";
import { Role } from "./role.entity";
import Controller from '../../interfaces/controller.interface';
import CreateRoleDto from "./role.dto";
import RecordNotFoundException from '../../exceptions/RecordNotFoundException';
import authenticationMiddleware from '../../middleware/authentication.middleware';
import validationMiddleware from '../../middleware/validation.middleware';

/**
 * Handles CRUD operations on Role data in database
 */
class RoleController implements Controller {
  public path: string = "/roles";
  public router: Router = Router();
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

  private all = async (request: Request, response: Response, next: NextFunction) => {
    const roles = await this.roleRepository.find({ relations: ["permissions"] });
    response.send(roles);
  }

  private one = async (request: Request, response: Response, next: NextFunction) => {
    const { id } = request.params;
    const role = await this.roleRepository.findOne(id, { relations: ["permissions"] });
    if (role) {
      response.send(role);
    } else {
      next(new RecordNotFoundException(id));
    }
  }

  private save = async (request: Request, response: Response, next: NextFunction) => {
    const roleData: CreateRoleDto = request.body;
    await this.roleRepository.save(roleData);
    response.send(roleData);
  }

  private remove = async (request: Request, response: Response, next: NextFunction) => {
    const { id } = request.params;
    const roleToRemove = await this.roleRepository.findOne(id);
    if (roleToRemove) {
      await this.roleRepository.remove(roleToRemove);
      response.send(200);
    } else {
      next(new RecordNotFoundException(id));
    }
  }

}

export default RoleController;
