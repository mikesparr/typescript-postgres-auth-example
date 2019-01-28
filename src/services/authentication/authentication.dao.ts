import { getRepository, Repository } from "typeorm";
import event from "../../config/event";
import logger from "../../config/logger";
import AuthPermission from '../../interfaces/permission.interface';
import Dao from '../../interfaces/dao.interface';
import NotImplementedException from "../../exceptions/NotImplementedException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import UserExistsException from '../../exceptions/UserExistsException';
import WrongCredentialsException from '../../exceptions/WrongCredentialsException';
import { methodActions, getPermission } from "../../utils/authorization.helper";
import { hashPassword, verifyPassword, createToken, addTokenToDenyList, removeTokenFromCache } from "../../utils/authentication.helper";

import UserLoginDto from "./login.dto";
import { User } from "../../services/user/user.entity";
import { Role } from "../../services/role/role.entity";
import CreateUserDto from "../../services/user/user.dto";


/**
 * Handles CRUD operations on User data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class AuthenticationDao implements Dao {
  private resource: string = "authentication"; // matches defined user user 'resource'
  private userRepository: Repository<User> = getRepository(User);
  private roleRepository: Repository<Role> = getRepository(Role);

  constructor() {
  }

  public login = async (loginData: UserLoginDto): Promise<Object | Error> => {
    const user = await this.userRepository.findOne({ email: loginData.email }, { relations: ["roles"] });
    if (user) {
      const isPasswordMatching = await verifyPassword(loginData.password, user.password);
      if (isPasswordMatching) {
        user.password = undefined;
        const tokenData = await createToken(user);

        // log event to central handler
        event.emit("login", {
          actor: user,
          resource: this.resource,
          action: "create",
          verb: "login",
          object: user,
          timestamp: Date.now()
        });

        logger.info(`User with email ${user.email} just logged in`);
        return {user, token: tokenData};
      } else {
        throw new WrongCredentialsException();
      }
    } else {
      throw new WrongCredentialsException();
    }
  }

  public logout = async (user: User, token: string): Promise<Object | Error> => {
    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.PUT;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      await addTokenToDenyList(token);
      const success = await removeTokenFromCache(token);

      // log event to central handler
      event.emit("logout", {
        actor: user, 
        resource: this.resource, 
        action: action,
        verb: "logout", 
        object: null, 
        timestamp: Date.now()
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
        roles: [guestRole]
      });

      await this.userRepository.save(user);

      // log event to central handler
      event.emit("register", {
        actor: user, 
        resource: this.resource,
        action: "create",
        verb: "register", 
        object: user, 
        timestamp: Date.now()
      }); // before password removed in case need to store in another DB

      user.password = undefined;

      logger.info(`User with email ${user.email} just registered`);
      return user;
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

}

export default AuthenticationDao;
