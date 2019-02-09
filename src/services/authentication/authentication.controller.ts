import { NextFunction, Request, Response, Router } from "express";
import Controller from "../../interfaces/controller.interface";
import { parseToken } from "../../utils/authentication.helper";
import addUserAgent from "../../middleware/ua.middleware";
import authenticationMiddleware from "../../middleware/authentication.middleware";
import validationMiddleware from "../../middleware/validation.middleware";
import { Formatter } from "../../utils/formatter";

import UserEmailDto from "./email.dto";
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

  private fmt: Formatter = new Formatter();
  private authenticationDao: AuthenticationDao = new AuthenticationDao();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, authenticationMiddleware); // secure index route (require login)
    this.router.get(`${this.path}/healthz`, this.healthCheck);
    this.router.get(`${this.path}/verify/:token`, addUserAgent, this.verify);
    this.router.post(`${this.path}/login`, validationMiddleware(UserLoginDto), addUserAgent, this.login);
    this.router.post(`${this.path}/impersonate/:id`, authenticationMiddleware, addUserAgent, this.impersonate);
    this.router.post(`${this.path}/logout`, authenticationMiddleware, this.logout);
    this.router.post(`${this.path}/register`, validationMiddleware(CreateUserDto), addUserAgent, this.register);
    this.router.post(`${this.path}/lost-password`, validationMiddleware(UserEmailDto), this.lostPassword);
    this.router.delete(`${this.path}/tokens/:id`, authenticationMiddleware, this.removeToken);
  }

  /**
   * Returns valid token if successful login credentials
   */
  private login = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const loginData: UserLoginDto = request.body;

    try {
      const data: any = await this.authenticationDao.login(loginData, request.userAgent);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Returns valid token if allowed to impersonate another valid user
   */
  private impersonate = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      const data: any = await this.authenticationDao.impersonate(request.user, id, request.userAgent);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Removes token from cache and prevents future requests for that device
   */
  private logout = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    try {
      const data: any = await this.authenticationDao.logout(request.user, parseToken(request));
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Registers new guest user (pending verification) and stores in database
   */
  private register = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const userData: CreateUserDto = request.body;

    try {
      const data: any = await this.authenticationDao.register(userData, request.userAgent);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accepts token in URL and activates user and logs them in if valid
   */
  private verify = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const tempToken: string = request.params.token;

    try {
      const verificationResult: {[key: string]: any} =
              await this.authenticationDao.verifyToken(tempToken, request.userAgent);
      const redirectUrl: string = `${process.env.CLIENT_REDIRECT_URL}?token=${verificationResult.token}`;
      // TODO: require client to register redirect URL at some point (perhaps during register)
      response.redirect(redirectUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Attempts to send encoded link via email if user email match
   */
  private lostPassword = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const userData: UserEmailDto = request.body;

    try {
      const data: any = await this.authenticationDao.lostPassword(userData, request.userAgent);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  private removeToken = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const { id } = request.params;

    try {
      const data: any = await this.authenticationDao.removeToken(request.user, id);
      response.send(this.fmt.formatResponse(data, Date.now() - request.startTime, "OK"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sends back successful response if system is running for container
   * orchestration or other load balancing tools
   */
  private healthCheck = async (request: Request, response: Response, next: NextFunction) => {
    response.send(this.fmt.formatResponse({success: true}, 0, "OK"));
  }

}

export default AuthenticationController;
