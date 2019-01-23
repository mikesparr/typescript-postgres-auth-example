import { NextFunction, Request, Response, Router } from "express";
import { getRepository } from "typeorm";
import { User } from "./user.entity";
import Controller from '../../interfaces/controller.interface';
import CreateUserDto from "./user.dto";
import UserNotFoundException from '../../exceptions/UserNotFoundException';
import validationMiddleware from '../../middleware/validation.middleware';

class UserController implements Controller {
  public path: string = "/posts";
  public router: Router = Router();
  private userRepository = getRepository(User);

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, this.all);
    this.router.get(`${this.path}/:id`, this.one);
    this.router
      //.all(`${this.path}/*`, authMiddleware)
      .post(this.path, validationMiddleware(CreateUserDto), this.save)
      .put(`${this.path}/:id`, validationMiddleware(CreateUserDto, true), this.save)
      .delete(`${this.path}/:id`, this.remove)
  }

  private async all(request: Request, response: Response, next: NextFunction) {
    const users = await this.userRepository.find();
    response.send(users);
  }

  private async one(request: Request, response: Response, next: NextFunction) {
    const { id } = request.params;
    const user = await this.userRepository.findOne(id);
    if (user) {
      response.send(user);
    } else {
      next(new UserNotFoundException(id));
    }
  }

  private async save(request: Request, response: Response, next: NextFunction) {
    const userData: CreateUserDto = request.body;
    await this.userRepository.save(userData);
    response.send(userData);
  }

  private async remove(request: Request, response: Response, next: NextFunction) {
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
