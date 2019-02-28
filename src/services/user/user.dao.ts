import { getConnection, Repository } from "typeorm";
import logger from "../../config/logger";

import Dao from "../../interfaces/dao.interface";
import { ActivityType, ActorType, ObjectType } from "../../interfaces/activitystream.interface";
import SearchResult from "../../interfaces/searchresult.interface";
import URLParams from "../../interfaces/urlparams.interface";

import DuplicateRecordException from "../../exceptions/DuplicateRecordException";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";
import RecordsNotFoundException from "../../exceptions/RecordsNotFoundException";
import NotImplementedException from "../../exceptions/NotImplementedException";
import MissingParametersException from "../../exceptions/MissingParametersException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";

import { event } from "../../utils/activity.helper";
import { AuthPermission, getPermission } from "../../utils/authorization.helper";
import { DataType, Formatter } from "../../utils/formatter";
import { getFlagsForUser, refreshUserFlags } from "../../utils/flag.helper";
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

  constructor() {
    // nothing
  }

  public getAll = async (user: User, params?: {[key: string]: any}):
            Promise<SearchResult> => {
    if (!user) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);

    const records = await userRepository.find({ relations: ["roles"] });

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
    if (!user || !id) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);

    const record = await userRepository.findOne(id, { relations: ["roles"] });

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
          object: {id: record.id, type: ObjectType.Person},
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
    if (!user || !data) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);

    const newRecord: CreateUserDto = data;

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.CREATE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      try {
        const filteredData: User = permission.filter(newRecord);
        const savedData: User = await userRepository.save(filteredData);

        // log event to central handler
        const ended: number = Date.now();
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: {...savedData, type: ObjectType.Person},
          resource: this.resource,
          timestamp: ended,
          took: ended - started,
          type: action,
        });

        logger.info(`Saved ${this.resource} with ID ${filteredData.id} in the database`);
        return permission.filter(savedData);
      } catch (error) {
        logger.error(`$$$$$$$$$$$$$$ ${error} $$$$$$$$$$$$$`);
        throw new DuplicateRecordException();
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public update = async (user: User, data: any):
            Promise<User | RecordNotFoundException | UserNotAuthorizedException> => {
    if (!user || !data) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);

    const isOwnerOrMember: boolean = (data.id && String(user.id) === String(data.id));
    const action: string = ActivityType.UPDATE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const recordToUpdate = await userRepository.findOne(data.id);

      if (recordToUpdate) {
        try {
          const savedData: User = userRepository.merge(new User(), recordToUpdate, permission.filter(data));
          const updateResult: any = await userRepository.update({ id: data.id }, savedData);

          // log event to central handler
          const ended: number = Date.now();
          event.emit(action, {
            actor: {id: user.id, type: ActorType.Person},
            object: {...savedData, type: ObjectType.Person},
            resource: this.resource,
            timestamp: ended,
            took: ended - started,
            type: action,
          });

          logger.info(`Updated ${this.resource} with ID ${data.id} in the database`);
          return permission.filter(savedData);
        } catch (error) {
          throw new Error("Investigate me please");
        }
      } else {
        throw new RecordNotFoundException(data.id);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public remove = async (user: User, id: string):
            Promise<boolean | RecordNotFoundException | UserNotAuthorizedException> => {
    if (!user || !id) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);

    const recordToRemove = await userRepository.findOne(id);

    const isOwnerOrMember: boolean = String(user.id) === String(id);
    const action: string = ActivityType.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (recordToRemove) {
        recordToRemove.archived = true;
        await userRepository.update({ id }, recordToRemove);
        await addAllUserTokensToDenyList(recordToRemove);

        // log event to central handler
        const ended: number = Date.now();
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: {id, type: ObjectType.Person},
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
    if (!user || !tokenUserId) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);

    const record = await userRepository.findOne(tokenUserId);

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
          resource: this.tokenResource,
          target: {id: tokenUserId, type: ObjectType.Person},
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
    if (!user || !flagUserId) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);

    const record = await userRepository.findOne(flagUserId);

    const isOwnerOrMember: boolean = String(user.id) === String(flagUserId);
    const action: string = ActivityType.READ;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.flagResource);

    if (permission.granted) {
      logger.info(`User ${user.id} viewing tokens for user ${flagUserId}`);

      if (!record) {
        throw new RecordNotFoundException(flagUserId);
      } else {
        const userFlags: Array<{[key: string]: any}> = await getFlagsForUser(record);

        // TODO: add TTL check for cached flag and trigger refresh

        // log event to central handler
        const ended: number = Date.now();
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: null,
          resource: this.flagResource,
          target: {id: flagUserId, type: ObjectType.Person},
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
    if (!user || !id || !tokenId) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

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
          object: {id: tokenId, type: ObjectType.Token},
          resource: this.tokenResource,
          target: {id, type: ObjectType.Person},
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
    if (!user || !id) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);

    const record = await userRepository.findOne(id);

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
          target: {id, type: ObjectType.Person},
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
    if (!user || !id) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);

    const record = await userRepository.findOne(id, { relations: ["roles"] });

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
          target: {id, type: ObjectType.Person},
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
    if (!user || !id || !data) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);
    const roleRepository: Repository<Role> = getConnection().getRepository(Role);

    const newRecord: AddRoleDto = data;

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.CREATE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.userRoleResource);

    if (permission.granted) {
      const relationToAdd = await roleRepository.findOne(newRecord.id, { relations: ["permissions"] });
      const recordToUpdate = await userRepository.findOne(id, { relations: ["roles"] });

      if (relationToAdd && recordToUpdate) {
        const filteredData: User = permission.filter(recordToUpdate);

        try {
          await userRepository
          .createQueryBuilder()
          .relation(User, "roles")
          .of({ id: recordToUpdate.id })
          .add([{ id: relationToAdd.id }]);
        } catch (relationError) {
          // catch duplicate key error just in case but confirm
          logger.error(relationError.message);
        }

        // log event to central handler
        const ended: number = Date.now();
        event.emit(ActivityType.ADD, {
          actor: {id: user.id, type: ActorType.Person},
          object: {id: newRecord.id, type: ObjectType.Role},
          resource: this.userRoleResource,
          target: {id, type: ObjectType.Person},
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
    if (!user || !id || !roleId) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const userRepository: Repository<User> = getConnection().getRepository(User);

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.userRoleResource);

    if (permission.granted) {
      const recordToUpdate = await userRepository.findOne(id, { relations: ["roles"] });

      if (recordToUpdate) {
        try {
          await userRepository
          .createQueryBuilder()
          .relation(User, "roles")
          .of(recordToUpdate)
          .remove({ id: roleId });

          // remove role from return object
          recordToUpdate.roles = recordToUpdate.roles.filter((role) => role.id !== roleId);
        } catch (relationError) {
          logger.error(relationError.message);
        }

        // log event to central handler
        const ended: number = Date.now();
        event.emit(ActivityType.REMOVE, {
          action,
          actor: {id: user.id, type: ActorType.Person},
          object: {id: roleId, type: ObjectType.Role},
          resource: this.userRoleResource,
          target: {id, type: ObjectType.Person},
          timestamp: ended,
          took: ended - started,
          type: ActivityType.REMOVE,
        });

        logger.info(`Removed ${this.userRoleResource} with ID ${roleId} from user ${id}`);
        return permission.filter(recordToUpdate);
      } else {
        throw new RecordNotFoundException(id);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.userRoleResource);
    }
  }

}

export default UserDao;
