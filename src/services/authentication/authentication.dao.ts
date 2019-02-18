import { getConnection, Repository } from "typeorm";
import logger from "../../config/logger";

import Dao from "../../interfaces/dao.interface";
import { Activity, ActivityType, ActorType, ObjectType } from "../../interfaces/activitystream.interface";
import SearchResult from "../../interfaces/searchresult.interface";
import URLParams from "../../interfaces/urlparams.interface";
import { ActivityRelation, RelationAction } from "../../interfaces/graph.interface";

import DuplicateRecordException from "../../exceptions/DuplicateRecordException";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";
import RecordsNotFoundException from "../../exceptions/RecordsNotFoundException";
import NotImplementedException from "../../exceptions/NotImplementedException";
import MissingParametersException from "../../exceptions/MissingParametersException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import UserExistsException from "../../exceptions/UserExistsException";
import AuthenticationTokenExpiredException from "../../exceptions/AuthenticationTokenExpiredException";
import WrongAuthenticationTokenException from "../../exceptions/WrongAuthenticationTokenException";
import WrongCredentialsException from "../../exceptions/WrongCredentialsException";

import { event } from "../../utils/activity.helper";
import { AuthPermission, getPermission } from "../../utils/authorization.helper";
import { DataType, Formatter } from "../../utils/formatter";
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

// helper for supporting multiple email types
// TODO: consider factoring to message and token interfaces for types
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
  private email: Email;

  constructor() {
    this.email = new Email(); // initialize
  }

  public login = async (loginData: UserLoginDto, userAgent: object): Promise<object | Error> => {
    if (!loginData || !userAgent) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);

    const user: User = await userRepository.findOne({ email: loginData.email }, { relations: ["roles"] });
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
    if (!user || !surrogateUserId || !userAgent) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);

    const foundUser: User = await userRepository.findOne(surrogateUserId);
    if (foundUser) {
      const isOwnerOrMember: boolean = false; // TODO: consider logic if manager in group
      const action: string = ActivityType.CREATE;
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
    if (!user || !token) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.UPDATE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      await addTokenToDenyList(token);
      const success = await removeTokenFromCache(token);

      // log event to central handler
      const ended: number = Date.now();
      event.emit(ActivityType.LEAVE, {
        actor: {id: user.id, type: ActorType.Person},
        object: null,
        resource: this.resource,
        timestamp: ended,
        took: ended - started,
        type: ActivityType.LEAVE,
      });

      logger.info(`User with email ${user.email} just logged out`);
      return {success, data: null};
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public register = async (userData: CreateUserDto, userAgent: object): Promise<User | Error> => {
    if (!userData || !userAgent) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);
    const roleRepository: Repository<Role> = getConnection().getRepository(Role);

    if (
      await userRepository.findOne({ email: userData.email, archived: false })
    ) {
      throw new UserExistsException(userData.email);
    } else {
      try {
        const hashedPassword = await hashPassword(userData.password);
        const guestRole = roleRepository.create({id: "guest"});
        const user = userRepository.create({
          ...userData,
          password: hashedPassword,
          roles: [guestRole],
        });

        const newUser: User = await userRepository.save(user);

        // log event to central handler
        const ended: number = Date.now();
        event.emit(ActivityType.CREATE, {
          actor: {id: "System", type: ActorType.Application},
          object: {...newUser, type: ObjectType.Person},
          resource: this.resource,
          timestamp: ended,
          took: ended - started,
          type: ActivityType.CREATE,
        }); // before password removed in case need to store in another DB

        await this.notifyByEmail(user, NotificationType.REGISTER);

        user.password = undefined;

        logger.info(`User with email ${user.email} just registered`);
        return user;
      } catch (error) {
        logger.error(`############# ${error} #############`);
        throw new Error("investigate me please");
      }
    }
  }

  public verifyToken = async (token: string, userAgent: object): Promise<object | Error> => {
    if (!token || !userAgent) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);
    const roleRepository: Repository<Role> = getConnection().getRepository(Role);

    if (! await isTokenInDenyList(token)) {
      try {
        const tokenResult: any = await readToken(token);

        const foundUser: User = await userRepository.findOne({ email: tokenResult.email });

        if (!foundUser) {
          throw new RecordNotFoundException(tokenResult.email);
        } else {
          switch (tokenResult.type) {
            case TokenTypes.REGISTER:
              const userRole: Role = roleRepository.create({id: "user"});
              foundUser.roles = [userRole];
              await userRepository.update({ id: foundUser.id }, foundUser);
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
          // TODO: use invite, accept, and create activites (probably 2 UPDATE user, ACCEPT invite)
          event.emit(ActivityType.ACCEPT, {
            actor: {id: foundUser.id, type: ActorType.Person},
            object: {id: token, type: ObjectType.Token},
            resource: this.resource,
            timestamp: ended,
            took: ended - started,
            type: ActivityType.ACCEPT,
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
    if (!userData || !userAgent) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);

    const foundUser = await userRepository.findOne({ email: userData.email });

    if (foundUser) {
      // log event to central handler
      const ended: number = Date.now();
      // TODO: figure out whether we create invite
      event.emit(ActivityType.INVITE, {
        actor: {id: foundUser.id, type: ActorType.Person},
        object: {id: foundUser.id, type: ObjectType.Person},
        resource: this.resource,
        timestamp: ended,
        took: ended - started,
        type: ActivityType.INVITE,
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
    if (!user || !id) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const recordToRemove = await decodeToken(id);

    const isOwnerOrMember: boolean = String(user.id) === String(recordToRemove.id);
    const action: string = ActivityType.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.tokenResource);

    if (permission.granted) {
      if (recordToRemove) {
        await removeTokenFromCache(id);

        // log event to central handler
        const ended: number = Date.now();
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: {id, type: ObjectType.Token},
          resource: this.tokenResource,
          timestamp: ended,
          took: ended - started,
          type: action,
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
    // TODO: check if need to name Application (that user join)
    const ended: number = Date.now();
    event.emit(ActivityType.ARRIVE, {
      actor: isSurrogate ?
        {...user.surrogatePrincipal, type: ActorType.Person}
        : {...user, type: ActorType.Person},
      object: null,
      resource: isSurrogate ? this.surrogateResource : this.resource,
      timestamp: ended,
      took: ended - started,
      type: ActivityType.ARRIVE,
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
      const userRepository: Repository<User> = getConnection().getRepository(User);
      const tokenResult: any = await decodeToken(token);

      const foundUser: User = await userRepository.findOne({ email: tokenResult.email });

      if (foundUser) {
        // log event to central handler
        const ended: number = Date.now();
        // TODO: figure out invite flow in auth
        event.emit(ActivityType.INVITE, {
          actor: {...foundUser, type: ActorType.Person},
          object: {...foundUser, type: ObjectType.Person},
          resource: this.resource,
          timestamp: ended,
          took: ended - started,
          type: ActivityType.INVITE,
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
