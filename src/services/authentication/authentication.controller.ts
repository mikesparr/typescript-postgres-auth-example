import { NextFunction, Request, Response, Router } from "express";
import { getRepository, Repository } from "typeorm";
import Controller from '../../interfaces/controller.interface';
import WrongCredentialsException from '../../exceptions/WrongCredentialsException';
import UserExistsException from '../../exceptions/UserExistsException';
import { hashPassword, verifyPassword, createToken, parseToken, removeTokenFromCache } from "../../utils/authentication.helper";
import authenticationMiddleware from '../../middleware/authentication.middleware';
import validationMiddleware from '../../middleware/validation.middleware';

import { User } from "../user/user.entity";
import { Role } from "../role/role.entity";
import UserLoginDto from "./login.dto";
import CreateUserDto from "../user/user.dto";
import RequestWithUser from "../../interfaces/request.interface";

class AuthenticationController implements Controller {
  public path: string = "";
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
    // TODO: confirm email
  }

  private login = async (request: Request, response: Response, next: NextFunction) => {
    const loginData: UserLoginDto = request.body;
    const user = await this.userRepository.findOne({ email: loginData.email }, { relations: ["roles"] });
    if (user) {
      const isPasswordMatching = await verifyPassword(loginData.password, user.password);
      if (isPasswordMatching) {
        user.password = undefined;
        const tokenData = await createToken(user);
        // TODO: consider response.setHeader('Set-Cookie', [this.createCookie(tokenData)]);
        response.send({user, token: tokenData});
      } else {
        next(new WrongCredentialsException());
      }
    } else {
      next(new WrongCredentialsException());
    }
  }

  private logout = async (request: RequestWithUser, response: Response, next: NextFunction) => {
    const success = await removeTokenFromCache(parseToken(request));
    response.send({success, data: null});
  }

  // TODO: send email verification link before user active
  private register = async (request: Request, response: Response, next: NextFunction) => {
    const userData: CreateUserDto = request.body;
    if (
      await this.userRepository.findOne({ email: userData.email })
    ) {
      next(new UserExistsException(userData.email));
    } else {
      const hashedPassword = await hashPassword(userData.password);
      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
        roles: [{id: "guest"}]
      });
      await this.userRepository.save(user);
      user.password = undefined;
      response.send(user);
    }
  }

}

export default AuthenticationController;
