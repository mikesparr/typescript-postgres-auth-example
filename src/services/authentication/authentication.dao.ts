import { getRepository, Repository, Not } from "typeorm";
import event from "../../config/event";
import logger from "../../config/logger";

import UserExistsException from "../../exceptions/UserExistsException";
import NotImplementedException from "../../exceptions/NotImplementedException";
import Dao from "../../interfaces/dao.interface";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import WrongCredentialsException from "../../exceptions/WrongCredentialsException";

import { AuthPermission, getPermission, methodActions } from "../../utils/authorization.helper";
import {
  TokenTypes,
  addTokenToDenyList,
  createUserToken,
  createEmailToken,
  readToken,
  hashPassword,
  getTokenFromCache,
  removeTokenFromCache,
  isTokenInDenyList,
  verifyPassword,
  storeTokenInCache} from "../../utils/authentication.helper";

import Email from "../email/email";
import UserLoginDto from "./login.dto";
import CreateUserDto from "../../services/user/user.dto";
import { Role } from "../../services/role/role.entity";
import { User } from "../../services/user/user.entity";
import AuthenticationTokenExpiredException from "../../exceptions/AuthenticationTokenExpiredException";
import WrongAuthenticationTokenException from "../../exceptions/WrongAuthenticationTokenException";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";

// helper for supporting multiple email types
enum NotificationType {
  REGISTER = "register",
  RE_REGISTER = "re_register",
}

/**
 * Handles CRUD operations on User data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class AuthenticationDao implements Dao {
  private resource: string = "authentication"; // matches defined user user 'resource'
  private userRepository: Repository<User> = getRepository(User);
  private roleRepository: Repository<Role> = getRepository(Role);
  private email: Email;

  constructor() {
    this.email = new Email(); // initialize
  }

  public login = async (loginData: UserLoginDto): Promise<object | Error> => {
    const user: User = await this.userRepository.findOne({ email: loginData.email }, { relations: ["roles"] });
    if (user) {
      const isPasswordMatching = await verifyPassword(loginData.password, user.password);
      if (isPasswordMatching) {
        user.password = undefined;
        return this.logUserIn(user);
      } else {
        throw new WrongCredentialsException();
      }
    } else {
      throw new WrongCredentialsException();
    }
  }

  public logout = async (user: User, token: string): Promise<object | Error> => {
    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.PUT;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      await addTokenToDenyList(token);
      const success = await removeTokenFromCache(token);

      // log event to central handler
      event.emit("logout", {
        action,
        actor: user,
        object: null,
        resource: this.resource,
        timestamp: Date.now(),
        verb: "logout",
      });

      logger.info(`User with email ${user.email} just logged out`);
      return {success, data: null};
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public register = async (userData: CreateUserDto): Promise<User | Error> => {
    if (
      await this.userRepository.findOne({ email: userData.email })
    ) {
      throw new UserExistsException(userData.email);
    } else {
      const hashedPassword = await hashPassword(userData.password);
      const guestRole = this.roleRepository.create({id: "guest"});
      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
        roles: [guestRole],
      });

      await this.userRepository.save(user);

      // log event to central handler
      event.emit("register", {
        action: "create",
        actor: user,
        object: user,
        resource: this.resource,
        timestamp: Date.now(),
        verb: "register",
      }); // before password removed in case need to store in another DB

      await this.notifyByEmail(user, NotificationType.REGISTER);

      user.password = undefined;

      logger.info(`User with email ${user.email} just registered`);
      return user;
    }
  }

  public verifyToken = async (token: string): Promise<object | Error> => {
    if (! await isTokenInDenyList(token)) {
      try {
        const tokenResult: any = await readToken(token);

        const foundUser: User = await this.userRepository.findOne({ email: tokenResult.email });

        if (!foundUser) {
          throw new RecordNotFoundException(tokenResult.email);
        } else {
          switch (tokenResult.type) {
            case TokenTypes.EMAIL:
              const userRole: Role = this.roleRepository.create({id: "user"});
              foundUser.roles = [userRole];
              await this.userRepository.save(foundUser);
              break;
            case TokenTypes.PASSWORD:
              throw new NotImplementedException(`tokenType:${TokenTypes.PASSWORD}`);
            case TokenTypes.USER:
            default:
              throw new NotImplementedException(`tokenType:${TokenTypes.USER}`);
          }

          // log event to central handler
          event.emit("verify", {
            action: "update",
            actor: foundUser,
            object: foundUser,
            resource: this.resource,
            timestamp: Date.now(),
            verb: "verify",
          });

          // destroy temp token
          await addTokenToDenyList(token);
          await removeTokenFromCache(token);

          return this.logUserIn(foundUser);
        }
      } catch (error) {
        if (error.message === "invalid algorithm" && await getTokenFromCache(token)) {
          logger.info(`User tried to verify expired token ${token}. Re-issuing ...`);

        } else {
          logger.warn(`Error verifying token ${token}`);
          logger.error(error.message);
          throw new WrongAuthenticationTokenException();
        }
      }
    } else {
      throw new AuthenticationTokenExpiredException();
    }
  }

  /**
   * Just to satisfy interface requirements, but not used for Authentication
   */
  public getAll = async (user: User, params?: {[key: string]: any}):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("getAll");
  }
  public getOne = async (user: User, id: string | number):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("getOne");
  }
  public save = async (user: User, data: any):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("save");
  }
  public remove = async (user: User, id: string | number):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("remove");
  }
  /**
   * END unused methods
   */

  /**
   * Convenience method to reuse the user login token generation
   * and event emitting
   *
   * @param user
   */
  private logUserIn = async (user: User): Promise<{[key: string]: any}> => {
    const tokenData = await createUserToken(user);

    // log event to central handler
    event.emit("login", {
      action: "create",
      actor: user,
      object: user,
      resource: this.resource,
      timestamp: Date.now(),
      verb: "login",
    });

    logger.info(`User with email ${user.email} just logged in`);
    return {user, token: tokenData};
  }

  /**
   * Convenience method to reuse sending notifications for auth events
   *
   * @param user
   * @param type
   */
  private notifyByEmail = async (user: User, type: NotificationType): Promise<void> => {
    try {
      // TODO: add HTML email template config
      let emailBody: string;
      let emailSubject: string;
      let emailToken: string;
      switch (type) {
        case NotificationType.RE_REGISTER:
          emailToken = await createEmailToken(user.email, "1h");
          emailSubject = `Demo App: email confirmation required`;
          emailBody = `Attempt to confirm registration with expired token. Please \
                      click this new link to confirm your email address with \
                      us: ${process.env.API_BASE_URL}/verify/${emailToken}`;
          break;
        case NotificationType.REGISTER:
        default:
          emailToken = await createEmailToken(user.email, "1h");
          emailSubject = `Demo App: email confirmation required`;
          emailBody = `Click this link to confirm your email address with \
                      us: ${process.env.API_BASE_URL}/verify/${emailToken}`;
          break;
      }

      // add temp token to cache to handle expiry case
      await storeTokenInCache(emailToken);

      await this.email.send({
        from: process.env.EMAIL_FROM_DEFAULT,
        subject: emailSubject,
        text: emailBody,
        to: user.email,
      });
    } catch (error) {
      logger.error(`Registration email failed for ${user.email}`);
    }
  }

}

export default AuthenticationDao;
