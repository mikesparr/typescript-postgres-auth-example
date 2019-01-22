import {NextFunction, Request, Response} from "express";
import {getRepository} from "typeorm";
import {User} from "./user.entity";

export class UserController {

  private userRepository = getRepository(User);

  public async all(request: Request, response: Response, next: NextFunction) {
    return this.userRepository.find();
  }

  public async one(request: Request, response: Response, next: NextFunction) {
    return this.userRepository.findOne(request.params.id);
  }

  public async save(request: Request, response: Response, next: NextFunction) {
    return this.userRepository.save(request.body);
  }

  public async remove(request: Request, response: Response, next: NextFunction) {
    const userToRemove = await this.userRepository.findOne(request.params.id);
    await this.userRepository.remove(userToRemove);
  }

}
