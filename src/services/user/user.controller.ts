import { NextFunction, Request, Response, Router } from "express";
import { getRepository, Repository } from "typeorm";
import { User } from "./user.entity";
import AuthPermission from '../../interfaces/permission.interface';
import Controller from '../../interfaces/controller.interface';
import RequestWithUser from "../../interfaces/request.interface";
import CreateUserDto from "./user.dto";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import UserNotFoundException from '../../exceptions/UserNotFoundException';
import RecordsNotFoundException from '../../exceptions/RecordsNotFoundException';
import authenticationMiddleware from '../../middleware/authentication.middleware';
import validationMiddleware from '../../middleware/validation.middleware';
import { methodActions, getPermission } from "../../utils/authorization.helper";

/**
 * Handles CRUD operations on User data in database
 */
class UserController implements Controller {
  public path: string = "/users";
  public router: Router = Router();
  private resource: string = "user"; // use for authorization
  private userRepository: Repository<User> = getRepository(User);

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
    const users = await this.userRepository.find({ relations: ["roles"] });
    
    const isOwnerOrMember: boolean = false;
    const action: string = methodActions[request.method];
    const permission: AuthPermission = await getPermission(request.user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (!users) {
        next(new RecordsNotFoundException(this.resource));
      } else {
        response.send(permission.filter(users));
      }
    } else {
      next(new UserNotAuthorizedException(request.user.id, action, this.resource));
    }
  }

  private one = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;
    const user = await this.userRepository.findOne(id, { relations: ["roles"] });

    const isOwnerOrMember: boolean = request.user.id === user.id;
    const action: string = methodActions[request.method];
    const permission: AuthPermission = await getPermission(request.user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (!user) {
        next(new UserNotFoundException(id));
      } else {
        response.send(permission.filter(user));
      }
    } else {
      next(new UserNotAuthorizedException(request.user.id, action, this.resource));
    }
  }

  private save = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;
    const userData: CreateUserDto = request.body;

    const isOwnerOrMember: boolean = id && Number(request.user.id) === Number(id);
    const action: string = methodActions[request.method];
    const permission: AuthPermission = await getPermission(request.user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const filteredData: CreateUserDto = permission.filter(userData);
      await this.userRepository.save(filteredData);
      response.send(filteredData);
    } else {
      next(new UserNotAuthorizedException(request.user.id, action, this.resource));
    }
  }

  private remove = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;    
    const userToRemove = await this.userRepository.findOne(id);

    const isOwnerOrMember: boolean = request.user.id === id;
    const action: string = methodActions[request.method];
    const permission: AuthPermission = await getPermission(request.user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (userToRemove) {
        await this.userRepository.remove(userToRemove);
        response.send(200);
      } else {
        next(new UserNotFoundException(id));
      }
    } else {
      next(new UserNotAuthorizedException(request.user.id, action, this.resource));
    }
  }

}

export default UserController;
