import { NextFunction, Request, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import { parseToken } from "../../utils/authentication.helper";
import authenticationMiddleware from "../../middleware/authentication.middleware";
import validationMiddleware from "../../middleware/validation.middleware";

import UserLoginDto from "./login.dto";
import CreateUserDto from "../user/user.dto";
import RequestWithUser from "../../interfaces/request.interface";
import AuthenticationDao from "./authentication.dao";

/**
 * Handles global route and authentication routes
 */
class AuthenticationController implements Controller {
  public path: string = "";
  public router: Router = Router();

  private authenticationDao: AuthenticationDao = new AuthenticationDao();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware); // secure index route (require login)
    this.router.post(`${this.path}/login`, validationMiddleware(UserLoginDto), this.login);
    this.router.post(`${this.path}/logout`, authenticationMiddleware, this.logout);
    this.router.post(`${this.path}/register`, validationMiddleware(CreateUserDto), this.register);
    // TODO: reset password
    // TODO: confirm email
  }

  /**
   * Returns valid token if successful login credentials
   */
  private login = async (request: Request, response: Response, next: NextFunction) => {
    const loginData: UserLoginDto = request.body;

    try {
      response.send(await this.authenticationDao.login(loginData));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Removes token from cache and prevents future requests for that device
   */
  private logout = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      response.send(await this.authenticationDao.logout(request.user, parseToken(request)));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Registers new guest user (pending verification) and stores in database
   * TODO: send email verification link
   */
  private register = async (request: Request, response: Response, next: NextFunction) => {
    const userData: CreateUserDto = request.body;

    try {
      response.send(await this.authenticationDao.register(userData));
    } catch (error) {
      next(error);
    }
  }

}

export default AuthenticationController;
