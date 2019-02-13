import { getRepository, Repository } from "typeorm";
import { ActivityType, event } from "../../utils/activity.helper";
import logger from "../../config/logger";
import Dao from "../../interfaces/dao.interface";
import {
  Activity,
  ActivityObject,
  Actor,
  ActorType } from "../../interfaces/activitystream.interface";
import SearchResult from "../../interfaces/searchresult.interface";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";
import RecordsNotFoundException from "../../exceptions/RecordsNotFoundException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import { AuthPermission, getPermission } from "../../utils/authorization.helper";
import { getFlagsForUser } from "../../utils/flag.helper";

import {
  addAllUserTokensToDenyList,
  getTokensFromUserTokensList,
  decodeToken,
  removeTokenFromCache,
  removeAllUserTokensFromCache,
} from "../../utils/authentication.helper";

import { User } from "./user.entity";
import { Role } from "./role.entity";
import CreateUserDto from "./user.dto";
import AddRoleDto from "./addrole.dto";

/**
 * Handles CRUD operations on User data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class UserDao implements Dao {
  private resource: string = "user"; // matches defined user user "resource"
  private flagResource: string = "flag";
  private tokenResource: string = "token";
  private userRoleResource: string = "userrole";
  private userRepository: Repository<User> = getRepository(User);
  private roleRepository: Repository<Role> = getRepository(Role);

  constructor() {
    // nothing
  }

  public getAll = async (user: User, params?: {[key: string]: any}):
            Promise<SearchResult> => {
    const started: number = Date.now();
    const records = await this.userRepository.find({ relations: ["roles"] });

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.READ;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (!records) {
        throw new RecordsNotFoundException(this.resource);
      } else {
        // log event to central handler
        const ended: number = Date.now();
        // TODO: CREATE Query about resource with result
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: null,
          resource: this.resource,
          timestamp: ended,
          took: ended - started,
          type: action,
        });

        return {
          data: permission.filter(records),
          length: records.length,
          total: records.length,
        };
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public getOne = async (user: User, id: string):
            Promise<User | RecordNotFoundException | UserNotAuthorizedException> => {
    const started: number = Date.now();
    const record = await this.userRepository.findOne(id, { relations: ["roles"] });

    const isOwnerOrMember: boolean = String(user.id) === String(id);
    const action: string = ActivityType.READ;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (!record) {
        throw new RecordNotFoundException(id);
      } else {
        // log event to central handler
        const ended: number = Date.now();
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: {id: record.id, type: this.resource},
          resource: this.resource,
          timestamp: ended,
          took: ended - started,
          type: action,
        });

        return permission.filter(record);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public save = async (user: User, data: any):
            Promise<User | RecordNotFoundException | UserNotAuthorizedException> => {
    const started: number = Date.now();
    const newRecord: CreateUserDto = data;

    const isOwnerOrMember: boolean = (data.id && String(user.id) === String(data.id));
    const action: string = data.id ? ActivityType.UPDATE : ActivityType.CREATE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const filteredData: User = permission.filter(newRecord);
      const savedData: User = await this.userRepository.save(filteredData);

      // log event to central handler
      const ended: number = Date.now();
      event.emit(action, {
        actor: {id: user.id, type: ActorType.Person},
        object: {...savedData, type: this.resource},
        resource: this.resource,
        timestamp: ended,
        took: ended - started,
        type: action,
      });

      logger.info(`Saved ${this.resource} with ID ${filteredData.id} in the database`);
      return filteredData;
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public remove = async (user: User, id: string):
            Promise<boolean | RecordNotFoundException | UserNotAuthorizedException> => {
    const started: number = Date.now();
    const recordToRemove = await this.userRepository.findOne(id);

    const isOwnerOrMember: boolean = String(user.id) === String(id);
    const action: string = ActivityType.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (recordToRemove) {
        await this.userRepository.remove(recordToRemove);
        await addAllUserTokensToDenyList(recordToRemove);

        // log event to central handler
        const ended: number = Date.now();
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: {id, type: this.resource},
          resource: this.resource,
          timestamp: ended,
          took: ended - started,
          type: action,
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

  public getTokens = async (user: User, tokenUserId: string): Promise<object | Error> => {
    const started: number = Date.now();
    const record = await this.userRepository.findOne(tokenUserId);

    const isOwnerOrMember: boolean = String(user.id) === String(tokenUserId);
    const action: string = ActivityType.READ;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.tokenResource);

    if (permission.granted) {
      logger.info(`User ${user.id} viewing tokens for user ${tokenUserId}`);

      if (!record) {
        throw new RecordNotFoundException(tokenUserId);
      } else {
        const userTokens: string[] = await getTokensFromUserTokensList(record);

        // log event to central handler
        const ended: number = Date.now();
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: null,
          resource: this.resource,
          target: {id: tokenUserId, type: ActorType.Person},
          timestamp: ended,
          took: ended - started,
          type: action,
        });

        return userTokens;
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.tokenResource);
    }
  }

  public getFlags = async (
          user: User, flagUserId: string): Promise<Array<{[key: string]: any}> | Error> => {
    const started: number = Date.now();
    const record = await this.userRepository.findOne(flagUserId);

    const isOwnerOrMember: boolean = String(user.id) === String(flagUserId);
    const action: string = ActivityType.READ;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.flagResource);

    if (permission.granted) {
      logger.info(`User ${user.id} viewing tokens for user ${flagUserId}`);

      if (!record) {
        throw new RecordNotFoundException(flagUserId);
      } else {
        const userFlags: Array<{[key: string]: any}> = await getFlagsForUser(record);

        // log event to central handler
        const ended: number = Date.now();
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: null,
          resource: this.resource,
          target: {id: flagUserId, type: ActorType.Person},
          timestamp: ended,
          took: ended - started,
          type: action,
        });

        return userFlags;
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.flagResource);
    }
  }

  public removeToken = async (user: User, id: string, tokenId: string):
            Promise<boolean | RecordNotFoundException | UserNotAuthorizedException> => {
    const started: number = Date.now();
    const recordToRemove = await decodeToken(tokenId);

    const isOwnerOrMember: boolean = String(user.id) === String(id);
    const action: string = ActivityType.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.tokenResource);

    if (permission.granted) {
      if (recordToRemove) {
        await removeTokenFromCache(tokenId);

        // log event to central handler
        const ended: number = Date.now();
        event.emit(ActivityType.REMOVE, {
          actor: {id: user.id, type: ActorType.Person},
          object: {id: tokenId, type: this.tokenResource},
          resource: this.tokenResource,
          target: {id, type: ActorType.Person},
          timestamp: ended,
          took: ended - started,
          type: action,
        });

        logger.info(`Removed ${this.tokenResource} with ID ${tokenId} from the cache`);
        return true;
      } else {
        throw new RecordNotFoundException(tokenId);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.tokenResource);
    }
  }

  public removeAllTokens = async (user: User, id: string):
            Promise<boolean | RecordNotFoundException | UserNotAuthorizedException> => {
    const started: number = Date.now();
    const record = await this.userRepository.findOne(id);

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.tokenResource);

    if (permission.granted) {
      if (record) {
        await removeAllUserTokensFromCache(record);

        // log event to central handler
        const ended: number = Date.now();
        // TODO: get list of tokens before removing
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: null,
          resource: this.tokenResource,
          target: {id, type: ActorType.Person},
          timestamp: ended,
          took: ended - started,
          type: action,
        });

        logger.info(`Removed all ${this.tokenResource}s for user ${id} from the cache`);
        return true;
      } else {
        throw new RecordNotFoundException(id);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.tokenResource);
    }
  }

  public getRoles = async (user: User, id: string):
            Promise<User | RecordNotFoundException | UserNotAuthorizedException> => {
    const started: number = Date.now();
    const record = await this.userRepository.findOne(id, { relations: ["roles"] });

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.READ;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.userRoleResource);

    if (permission.granted) {
      if (!record) {
        throw new RecordNotFoundException(id);
      } else {
        // log event to central handler
        const ended: number = Date.now();
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: null,
          resource: this.userRoleResource,
          target: {id, type: ActorType.Person},
          timestamp: ended,
          took: ended - started,
          type: action,
        });

        return permission.filter(record.roles);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.userRoleResource);
    }
  }

  public addRole = async (user: User, id: number, data: any):
            Promise<User | RecordNotFoundException | UserNotAuthorizedException> => {
    const started: number = Date.now();
    const newRecord: AddRoleDto = data;

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.CREATE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.userRoleResource);

    if (permission.granted) {
      const relationToAdd = await this.roleRepository.findOne(newRecord.id, { relations: ["permissions"] });
      const recordToUpdate = await this.userRepository.findOne(id, { relations: ["roles"] });

      if (relationToAdd && recordToUpdate) {
        const filteredData: User = permission.filter(recordToUpdate);

        try {
          await this.userRepository
          .createQueryBuilder()
          .relation(User, "roles")
          .of([{ id: recordToUpdate.id }])
          .add([{ id: relationToAdd.id }]);
        } catch (relationError) {
          // catch duplicate key error just in case but confirm
          logger.error(relationError.message);
        }

        // log event to central handler
        const ended: number = Date.now();
        event.emit(ActivityType.ADD, {
          actor: {id: user.id, type: ActorType.Person},
          object: {id: newRecord.id, type: "role"},
          resource: this.userRoleResource,
          target: {id, type: ActorType.Person},
          timestamp: ended,
          took: ended - started,
          type: ActivityType.ADD,
        });

        logger.info(`Added ${this.userRoleResource} with ID ${newRecord.id} to user ${recordToUpdate.id}`);
        return filteredData;
      } else {
        logger.warn(`Could not find user ${id} or role ${newRecord.id} to create relation`);
        throw new RecordNotFoundException(newRecord.id);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.userRoleResource);
    }
  }

  public removeRole = async (user: User, id: string, roleId: string):
            Promise<User | RecordNotFoundException | UserNotAuthorizedException> => {
    const started: number = Date.now();

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.userRoleResource);

    if (permission.granted) {
      const recordToUpdate = await this.userRepository.findOne(id, { relations: ["roles"] });

      if (recordToUpdate) {
        await this.userRepository
          .createQueryBuilder()
          .relation(User, "roles")
          .of([recordToUpdate])
          .remove({ id: roleId });

        const filteredData: User = permission.filter(recordToUpdate);
        await this.userRepository.save(recordToUpdate);

        // log event to central handler
        const ended: number = Date.now();
        event.emit(ActivityType.REMOVE, {
          action,
          actor: {id: user.id, type: ActorType.Person},
          object: {id: roleId, type: "role"},
          resource: this.userRoleResource,
          target: {id, type: ActorType.Person},
          timestamp: ended,
          took: ended - started,
          type: ActivityType.REMOVE,
        });

        logger.info(`Removed ${this.userRoleResource} with ID ${roleId} from user ${id}`);
        return filteredData;
      } else {
        throw new RecordNotFoundException(id);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.userRoleResource);
    }
  }

}

export default UserDao;
