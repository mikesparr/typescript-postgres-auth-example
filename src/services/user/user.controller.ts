import { NextFunction, Request, Response, Router } from "express";
import { getRepository, Repository } from "typeorm";
import { User } from "./user.entity";
import Controller from '../../interfaces/controller.interface';
import CreateUserDto from "./user.dto";
import UserNotFoundException from '../../exceptions/UserNotFoundException';
import authenticationMiddleware from '../../middleware/authentication.middleware';
import validationMiddleware from '../../middleware/validation.middleware';

/**
 * Handles CRUD operations on User data in database
 */
class UserController implements Controller {
  public path: string = "/users";
  public router: Router = Router();
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

  private all = async (request: Request, response: Response, next: NextFunction) => {
    const users = await this.userRepository.find({ relations: ["roles"] });
    response.send(users);
  }

  private one = async (request: Request, response: Response, next: NextFunction) => {
    const { id } = request.params;
    const user = await this.userRepository.findOne(id, { relations: ["roles"] });
    if (user) {
      response.send(user);
    } else {
      next(new UserNotFoundException(id));
    }
  }

  private save = async (request: Request, response: Response, next: NextFunction) => {
    const userData: CreateUserDto = request.body;
    await this.userRepository.save(userData);
    response.send(userData);
  }

  private remove = async (request: Request, response: Response, next: NextFunction) => {
    const { id } = request.params;
    const userToRemove = await this.userRepository.findOne(id);
    if (userToRemove) {
      await this.userRepository.remove(userToRemove);
      response.send(200);
    } else {
      next(new UserNotFoundException(id));
    }
  }

}

export default UserController;
