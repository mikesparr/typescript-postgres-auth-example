import { getRepository, Repository } from "typeorm";
import logger from "../../config/logger";
import AuthPermission from '../../interfaces/permission.interface';
import Dao from '../../interfaces/dao.interface';
import RecordNotFoundException from '../../exceptions/RecordNotFoundException';
import RecordsNotFoundException from '../../exceptions/RecordsNotFoundException';
import NotImplementedException from "../../exceptions/NotImplementedException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import UserExistsException from '../../exceptions/UserExistsException';
import WrongCredentialsException from '../../exceptions/WrongCredentialsException';
import { methodActions, getPermission } from "../../utils/authorization.helper";
import { hashPassword, verifyPassword, createToken, parseToken, removeTokenFromCache } from "../../utils/authentication.helper";

import UserLoginDto from "./login.dto";
import { User } from "../../services/user/user.entity";
import { Role } from "../../services/role/role.entity";
import CreateUserDto from "../../services/user/user.dto";


/**
 * Handles CRUD operations on User data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class AuthenticationDao implements Dao {
  private resource: string = "/"; // matches defined user user 'resource'
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
    // TODO: add to deny list
    // TODO: check permissions to log out
    const success = await removeTokenFromCache(token);

    logger.info(`User with email ${user.email} just logged out`);
    return {success, data: null};
  }

  public register = async (userData: CreateUserDto): Promise<User | Error> => {
    if (
      await this.userRepository.findOne({ email: userData.email })
    ) {
      logger.info(`Attempt to register duplicate user with email ${userData.email}`);
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
