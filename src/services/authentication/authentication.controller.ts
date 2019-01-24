import { NextFunction, Request, Response, Router } from "express";
import { getRepository, Repository } from "typeorm";
import { User } from "../user/user.entity";
import Controller from '../../interfaces/controller.interface';
import UserLoginDto from "./login.dto";
import CreateUserDto from "../user/user.dto";
import InvalidCredentialsException from '../../exceptions/InvalidCredentialsException';
import UserExistsException from '../../exceptions/UserExistsException';
import authenticationMiddleware from '../../middleware/authentication.middleware';
import validationMiddleware from '../../middleware/validation.middleware';

class AuthenticationController implements Controller {
  public path: string = "/";
  public router: Router = Router();
  private userRepository: Repository<User> = getRepository(User);

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware); // secure index route (require login)
    this.router.post(`${this.path}/login`, validationMiddleware(UserLoginDto), this.login);
    this.router.post(`${this.path}/logout`, authenticationMiddleware, this.logout);
    this.router.post(`${this.path}/register`, validationMiddleware(CreateUserDto), this.register);
    // TODO: reset password
  }

  private login = async (request: Request, response: Response, next: NextFunction) => {
    // TODO: lookup user by email, then compare password, add token to cache, then issue token
    const testToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.\
eyJpZCI6MTAxLCJmaXJzdE5hbWUiOiJNaWtlIiwibGFzdE5hbWUiOiJTcGFyciIsImFnZSI6NDF9.\
J9wlNGJuJTZwum0WlZ8Cb9ZV9mfhy8UhozMlzte_Dx0`;
    response.send({success: true, data: testToken});
  }

  private logout = async (request: Request, response: Response, next: NextFunction) => {
    // TODO: remove token from cache
    response.send({success: true, data: null});
  }

  private register = async (request: Request, response: Response, next: NextFunction) => {
    // TODO: confirm no existing user, then encrypt password
    // TODO: lookup roles by ID and assign
    const userData: CreateUserDto = request.body;
    await this.userRepository.save(userData);
    userData.password = undefined;
    response.send(userData);
  }

}

export default AuthenticationController;
