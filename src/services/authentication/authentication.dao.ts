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
  decodeToken,
  readToken,
  hashPassword,
  getTokenFromCache,
  removeTokenFromCache,
  isTokenInDenyList,
  verifyPassword,
  storeTokenInCache} from "../../utils/authentication.helper";

import Email from "../email/email";
import UserEmailDto from "./email.dto";
import UserLoginDto from "./login.dto";
import CreateUserDto from "../../services/user/user.dto";
import { Role } from "../user/role.entity";
import { User } from "../user/user.entity";
import AuthenticationTokenExpiredException from "../../exceptions/AuthenticationTokenExpiredException";
import WrongAuthenticationTokenException from "../../exceptions/WrongAuthenticationTokenException";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";

// helper for supporting multiple email types
enum NotificationType {
  PASSWORD = "password",
  REGISTER = "register",
  REISSUE = "reissue",
}

/**
 * Handles CRUD operations on User data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class AuthenticationDao implements Dao {
  private resource: string = "authentication"; // matches defined user user 'resource'
  private surrogateResource: string = "surrogate";
  private tokenResource: string = "token";
  private userRepository: Repository<User> = getRepository(User);
  private roleRepository: Repository<Role> = getRepository(Role);
  private email: Email;

  constructor() {
    this.email = new Email(); // initialize
  }

  public login = async (loginData: UserLoginDto, userAgent: object): Promise<object | Error> => {
    const started: number = Date.now();

    const user: User = await this.userRepository.findOne({ email: loginData.email }, { relations: ["roles"] });
    if (user) {
      const isPasswordMatching = await verifyPassword(loginData.password, user.password);
      if (isPasswordMatching) {
        user.password = undefined;
        return await this.logUserIn(user, userAgent, started);
      } else {
        throw new WrongCredentialsException();
      }
    } else {
      throw new WrongCredentialsException();
    }
  }

  public impersonate = async (
          user: User,
          surrogateUserId: string,
          userAgent: object): Promise<object | Error> => {
    const started: number = Date.now();

    const foundUser: User = await this.userRepository.findOne(surrogateUserId);
    if (foundUser) {
      const isOwnerOrMember: boolean = false; // TODO: consider logic if manager in group
      const action: string = methodActions.POST;
      const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.surrogateResource);

      if (permission.granted) {
        foundUser.surrogateEnabled = true;
        foundUser.surrogatePrincipal = user;
        const loginUser: User = permission.filter(foundUser);

        return await this.logUserIn(loginUser, userAgent, started);
      } else {
        throw new UserNotAuthorizedException(user.id, action, this.surrogateResource);
      }
    } else {
      throw new RecordNotFoundException(surrogateUserId);
    }
  }

  public logout = async (user: User, token: string): Promise<object | Error> => {
    const started: number = Date.now();
    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.PUT;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      await addTokenToDenyList(token);
      const success = await removeTokenFromCache(token);

      // log event to central handler
      const ended: number = Date.now();
      event.emit("logout", {
        action,
        actor: user,
        object: null,
        resource: this.resource,
        timestamp: ended,
        took: ended - started,
        verb: "logout",
      });

      logger.info(`User with email ${user.email} just logged out`);
      return {success, data: null};
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public register = async (userData: CreateUserDto, userAgent: object): Promise<User | Error> => {
    const started: number = Date.now();

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
      const ended: number = Date.now();
      event.emit("register", {
        action: "create",
        actor: user,
        object: user,
        resource: this.resource,
        timestamp: ended,
        took: ended - started,
        verb: "register",
      }); // before password removed in case need to store in another DB

      await this.notifyByEmail(user, NotificationType.REGISTER);

      user.password = undefined;

      logger.info(`User with email ${user.email} just registered`);
      return user;
    }
  }

  public verifyToken = async (token: string, userAgent: object): Promise<object | Error> => {
    const started: number = Date.now();

    if (! await isTokenInDenyList(token)) {
      try {
        const tokenResult: any = await readToken(token);

        const foundUser: User = await this.userRepository.findOne({ email: tokenResult.email });

        if (!foundUser) {
          throw new RecordNotFoundException(tokenResult.email);
        } else {
          switch (tokenResult.type) {
            case TokenTypes.REGISTER:
              const userRole: Role = this.roleRepository.create({id: "user"});
              foundUser.roles = [userRole];
              await this.userRepository.save(foundUser);
              break;
            case TokenTypes.PASSWORD:
              // just log user in
              break;
            case TokenTypes.LOGIN:
            default:
              throw new NotImplementedException(`tokenType:${TokenTypes.LOGIN}`);
          }

          // log event to central handler
          const ended: number = Date.now();
          event.emit("verify", {
            action: "update",
            actor: foundUser,
            object: token,
            resource: this.resource,
            timestamp: ended,
            took: ended - started,
            verb: "verify",
          });

          // destroy temp token
          await addTokenToDenyList(token);
          await removeTokenFromCache(token);

          return this.logUserIn(foundUser, userAgent, started);
        }
      } catch (error) {
        // first check if token previously existed, and user in database
        if (error.message === "invalid algorithm" && await getTokenFromCache(token)) {
          logger.info(`User tried to verify expired token ${token}. Re-issuing ...`);
          await this.reissueFromExpiredToken(token);
          throw new AuthenticationTokenExpiredException();
        } else {
          logger.warn(`Error verifying token ${token}`);
          logger.error(error.message);
          throw new WrongAuthenticationTokenException();
        }
      }
    } else {
      throw new WrongAuthenticationTokenException();
    }
  }

  public lostPassword = async (userData: UserEmailDto, userAgent: object): Promise<object | Error> => {
    const started: number = Date.now();
    const foundUser = await this.userRepository.findOne({ email: userData.email });

    if (foundUser) {
      // log event to central handler
      const ended: number = Date.now();
      event.emit("lost-password", {
        action: "create",
        actor: foundUser,
        object: {id: foundUser.id},
        resource: this.resource,
        timestamp: ended,
        took: ended - started,
        verb: "lost-password",
      });

      await this.notifyByEmail(foundUser, NotificationType.PASSWORD);
    } else {
      logger.warn(`Someone attempted invalid lost password for email ${userData.email}`);
    }

    return {
      message: "If valid user then an email was sent to address on file. Please check your email.",
      status: 200,
    };
  }

  public removeToken = async (user: User, id: string):
            Promise<boolean | RecordNotFoundException | UserNotAuthorizedException> => {
    const started: number = Date.now();
    const recordToRemove = await decodeToken(id);

    const isOwnerOrMember: boolean = String(user.id) === String(recordToRemove.id);
    const action: string = methodActions.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.tokenResource);

    if (permission.granted) {
      if (recordToRemove) {
        await removeTokenFromCache(id);

        // log event to central handler
        const ended: number = Date.now();
        event.emit("remove-token", {
          action,
          actor: user,
          object: id,
          resource: this.tokenResource,
          timestamp: ended,
          took: ended - started,
          verb: "remove-token",
        });

        logger.info(`Removed ${this.tokenResource} with ID ${id} from the cache`);
        return true;
      } else {
        throw new RecordNotFoundException(id);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.tokenResource);
    }
  }

  /**
   * Just to satisfy interface requirements, but not used for Authentication
   */
  public getAll = async (user: User, params?: {[key: string]: any}):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("getAll");
  }
  public getOne = async (user: User, id: string):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("getOne");
  }
  public save = async (user: User, data: any):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("save");
  }
  public remove = async (user: User, id: string):
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
  private logUserIn = async (user: User, userAgent: object, started: number): Promise<{[key: string]: any}> => {
    const tokenData = await createUserToken(user, userAgent);

    const isSurrogate: boolean = (user.surrogateEnabled && user.surrogatePrincipal) ? true : false;

    // log event to central handler
    // TODO: check if need tertiary logic for actor
    const ended: number = Date.now();
    event.emit(isSurrogate ? "impersonate" : "login", {
      action: "create",
      actor: user.surrogatePrincipal,
      object: user,
      resource: isSurrogate ? this.surrogateResource : this.resource,
      timestamp: ended,
      took: ended - started,
      verb: isSurrogate ? "impersonate" : "login",
    });

    let message: string;
    if (isSurrogate) {
      message = `User with email ${user.surrogatePrincipal.email} just logged in as ${user.email}`;
    } else {
      message = `User with email ${user.email} just logged in`;
    }
    logger.info(message);
    return {user, token: tokenData};
  }

  /**
   * Convenience method attempting to find user from expired token and
   * send them a magic link via email to regain access
   */
  private reissueFromExpiredToken = async (token: string): Promise<void> => {
    try {
      const started: number = Date.now();
      const tokenResult: any = await decodeToken(token);

      const foundUser: User = await this.userRepository.findOne({ email: tokenResult.email });

      if (foundUser) {
        // log event to central handler
        const ended: number = Date.now();
        event.emit("reissue", {
          action: "create",
          actor: foundUser,
          object: foundUser,
          resource: this.resource,
          timestamp: ended,
          took: ended - started,
          verb: "reissue",
        }); // before password removed in case need to store in another DB

        await this.notifyByEmail(foundUser, NotificationType.REGISTER, tokenResult.type);
      }
    } catch (error) {
      logger.error(error.message);
    }
  }

  /**
   * Convenience method to reuse sending notifications for auth events
   *
   * @param user
   * @param type
   */
  private notifyByEmail = async (
            user: User,
            type: NotificationType,
            tokenType: TokenTypes = TokenTypes.REGISTER): Promise<void> => {

    try {
      // TODO: add HTML email template config
      let emailBody: string;
      let emailSubject: string;
      let emailToken: string;
      switch (type) {
        case NotificationType.PASSWORD:
          emailToken = await createEmailToken(user.email, "1h", TokenTypes.PASSWORD);
          emailSubject = `Demo App: forgot password`;
          emailBody = `Sorry you forgot your password. If you requested this, \
                      please click the magic link below to log in. You can \
                      change your information after logging in. Login: \
                      ${process.env.API_BASE_URL}/verify/${emailToken}`;
          break;
        case NotificationType.REISSUE:
          emailToken = await createEmailToken(user.email, "1h");
          emailSubject = `Demo App: email confirmation required`;
          emailBody = `Attempt access with expired token. Please \
                      click this new link to access the app: \
                      ${process.env.API_BASE_URL}/verify/${emailToken}`;
          break;
        case NotificationType.REGISTER:
        default:
          emailToken = await createEmailToken(user.email, "6h");
          emailSubject = `Demo App: email confirmation required`;
          emailBody = `Click this link to confirm your email address with \
                      us: ${process.env.API_BASE_URL}/verify/${emailToken}`;
          break;
      }

      // add temp token to cache to handle expiry case
      await storeTokenInCache(emailToken, {vendor: undefined, model: undefined, type: undefined});

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
