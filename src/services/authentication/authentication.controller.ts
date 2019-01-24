import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextFunction, Request, Response, Router } from "express";
import { getRepository, Repository } from "typeorm";
import { User } from "../user/user.entity";
import Controller from '../../interfaces/controller.interface';
import UserLoginDto from "./login.dto";
import CreateUserDto from "../user/user.dto";
import WrongCredentialsException from '../../exceptions/WrongCredentialsException';
import UserExistsException from '../../exceptions/UserExistsException';
import authenticationMiddleware from '../../middleware/authentication.middleware';
import validationMiddleware from '../../middleware/validation.middleware';

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

  // TODO: consider response.setHeader('Set-Cookie', [this.createCookie(tokenData)]);
  private login = async (request: Request, response: Response, next: NextFunction) => {
    const loginData: UserLoginDto = request.body;
    const user = await this.userRepository.findOne({ email: loginData.email }, { relations: ["roles"] });
    if (user) {
      const isPasswordMatching = await bcrypt.compare(loginData.password, user.password);
      if (isPasswordMatching) {
        user.password = undefined;
        const tokenData = this.createToken(user);
        response.send({user, token: tokenData}); // TODO: decide how to send token back
      } else {
        next(new WrongCredentialsException());
      }
    } else {
      next(new WrongCredentialsException());
    }
  }

  private logout = async (request: Request, response: Response, next: NextFunction) => {
    // TODO: remove token from cache
    response.send({success: true, data: null});
  }

  // TODO: send email verification link before user active
  private register = async (request: Request, response: Response, next: NextFunction) => {
    const userData: CreateUserDto = request.body;
    if (
      await this.userRepository.findOne({ email: userData.email })
    ) {
      next(new UserExistsException(userData.email));
    } else {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
      });
      await this.userRepository.save(user);
      user.password = undefined;
      response.send(user);
    }
  }

  private createToken(user: User): string {
    const secret = process.env.JWT_SECRET;
    // TODO: consider embedding auth model (or cache it)
    const dataStoredInToken: {[key: string]: any} = {
      id: user.id,
      roles: user.roles,
      displayName: `${user.firstName} ${user.lastName}`,
      email: user.email,
    };

    return jwt.sign(dataStoredInToken, secret, { expiresIn: "1h" });
  }

}

export default AuthenticationController;
