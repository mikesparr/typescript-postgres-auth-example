import { getRepository, Repository } from "typeorm";
import event from "../../config/event";
import logger from "../../config/logger";
import Dao from "../../interfaces/dao.interface";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";
import RecordsNotFoundException from "../../exceptions/RecordsNotFoundException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import { AuthPermission, getPermission, methodActions } from "../../utils/authorization.helper";
import { getFlagsForUser } from "../../utils/flag.helper";

import {
  addAllUserTokensToDenyList,
  getTokensFromUserTokensList,
} from "../../utils/authentication.helper";

import { User } from "./user.entity";
import CreateUserDto from "./user.dto";
import { add } from "winston";

/**
 * Handles CRUD operations on User data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class UserDao implements Dao {
  private resource: string = "user"; // matches defined user user "resource"
  private flagResource: string = "flag";
  private tokenResource: string = "token";
  private userRepository: Repository<User> = getRepository(User);

  constructor() {
    // nothing
  }

  public getAll = async (user: User, params?: {[key: string]: any}):
            Promise<User[] | RecordsNotFoundException | UserNotAuthorizedException> => {
    const records = await this.userRepository.find({ relations: ["roles"] });

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.GET;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (!records) {
        throw new RecordsNotFoundException(this.resource);
      } else {
        // log event to central handler
        event.emit("read-all", {
          action,
          actor: user,
          object: records,
          resource: this.resource,
          timestamp: Date.now(),
          verb: "read-all",
        });

        return permission.filter(records);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public getOne = async (user: User, id: string | number):
            Promise<User | RecordNotFoundException | UserNotAuthorizedException> => {
    const record = await this.userRepository.findOne(id, { relations: ["roles"] });

    const isOwnerOrMember: boolean = String(user.id) === String(id);
    const action: string = methodActions.GET;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (!record) {
        throw new RecordNotFoundException(id);
      } else {
        // log event to central handler
        event.emit("read-one", {
          action,
          actor: user,
          object: record,
          resource: this.resource,
          timestamp: Date.now(),
          verb: "read-one",
        });

        return permission.filter(record);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public save = async (user: User, data: any):
            Promise<User | RecordNotFoundException | UserNotAuthorizedException> => {
    const newRecord: CreateUserDto = data;

    const isOwnerOrMember: boolean = (data.id && String(user.id) === String(data.id));
    const action: string = data.id ? methodActions.PUT : methodActions.POST;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const filteredData: User = permission.filter(newRecord);
      await this.userRepository.save(filteredData);

      // log event to central handler
      event.emit("save", {
        action,
        actor: user,
        object: filteredData,
        resource: this.resource,
        timestamp: Date.now(),
        verb: "save",
      });

      logger.info(`Saved ${this.resource} with ID ${filteredData.id} in the database`);
      return filteredData;
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public remove = async (user: User, id: string | number):
            Promise<boolean | RecordNotFoundException | UserNotAuthorizedException> => {
    const recordToRemove = await this.userRepository.findOne(id);

    const isOwnerOrMember: boolean = String(user.id) === String(id);
    const action: string = methodActions.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (recordToRemove) {
        await this.userRepository.remove(recordToRemove);
        await addAllUserTokensToDenyList(recordToRemove);

        // log event to central handler
        event.emit("remove", {
          action,
          actor: user,
          object: recordToRemove,
          resource: this.resource,
          timestamp: Date.now(),
          verb: "remove",
        });

        logger.info(`Removed ${this.resource} with ID ${id} from the database`);
        return true;
      } else {
        throw new RecordNotFoundException(id);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public getUserTokens = async (user: User, tokenUserId: string | number): Promise<object | Error> => {
    const record = await this.userRepository.findOne(tokenUserId);

    const isOwnerOrMember: boolean = String(user.id) === String(tokenUserId);
    const action: string = methodActions.GET;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.tokenResource);

    if (permission.granted) {
      logger.info(`User ${user.id} viewing tokens for user ${tokenUserId}`);

      if (!record) {
        throw new RecordNotFoundException(tokenUserId);
      } else {
        const userTokens: string[] = await getTokensFromUserTokensList(record);

        // log event to central handler
        event.emit("read-tokens", {
          action,
          actor: user,
          object: userTokens,
          resource: this.resource,
          timestamp: Date.now(),
          verb: "read-tokens",
        });

        return userTokens;
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.tokenResource);
    }
  }

  public getUserFlags = async (
          user: User, flagUserId: string | number): Promise<Array<{[key: string]: any}> | Error> => {
    const record = await this.userRepository.findOne(flagUserId);

    const isOwnerOrMember: boolean = String(user.id) === String(flagUserId);
    const action: string = methodActions.GET;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.flagResource);

    if (permission.granted) {
      logger.info(`User ${user.id} viewing tokens for user ${flagUserId}`);

      if (!record) {
        throw new RecordNotFoundException(flagUserId);
      } else {
        const userFlags: Array<{[key: string]: any}> = await getFlagsForUser(record);

        // log event to central handler
        event.emit("read-user-flags", {
          action,
          actor: user,
          object: userFlags,
          resource: this.resource,
          timestamp: Date.now(),
          verb: "read-user-flags",
        });

        return userFlags;
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.flagResource);
    }
  }

}

export default UserDao;
