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

import { User } from "./user.entity";
import { Role } from "./role.entity";
import { Permission } from "./permission.entity";
import CreateRoleDto from "./role.dto";

/**
 * Handles CRUD operations on Role data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class RoleDao implements Dao {
  private resource: string = "role"; // matches defined role role "resource"
  private rolePermissionResource: string = "rolepermission";

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
    const roleRepository: Repository<Role> = getConnection().getRepository(Role);

    const records = await roleRepository.find({ relations: ["permissions"] });

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.READ;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (!records) {
        throw new RecordsNotFoundException(this.resource);
      } else {
        // log event to central handler
        const ended: number = Date.now();
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
            Promise<Role | RecordNotFoundException | UserNotAuthorizedException> => {
    if (!user || !id) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const roleRepository: Repository<Role> = getConnection().getRepository(Role);

    const record = await roleRepository.findOne(id, { relations: ["permissions"] });

    const isOwnerOrMember: boolean = false;
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
          object: {id: record.id, type: ObjectType.Role},
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
            Promise<Role | RecordNotFoundException | UserNotAuthorizedException> => {
    if (!user || !data) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const roleRepository: Repository<Role> = getConnection().getRepository(Role);
    const newRecord: CreateRoleDto = data;

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.CREATE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      try {
        const filteredData: Role = permission.filter(newRecord);
        const savedData: Role = await roleRepository.save(filteredData);

        // log event to central handler
        const ended: number = Date.now();
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: {...savedData, type: ObjectType.Role},
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
            Promise<Role | RecordNotFoundException | UserNotAuthorizedException> => {
    if (!user || !data) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const roleRepository: Repository<Role> = getConnection().getRepository(Role);

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.UPDATE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const recordToUpdate = await roleRepository.findOne(data.id);

      if (recordToUpdate) {
        try {
          const savedData: Role = roleRepository.merge(new Role(), recordToUpdate, permission.filter(data));
          const updateResult: any = await roleRepository.update({ id: data.id }, savedData);

          // log event to central handler
          const ended: number = Date.now();
          event.emit(action, {
            actor: {id: user.id, type: ActorType.Person},
            object: {...savedData, type: ObjectType.Role},
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
    const roleRepository: Repository<Role> = getConnection().getRepository(Role);

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      let recordToRemove: Role;
      try {
        recordToRemove = await roleRepository.findOneOrFail(id);
      } catch (lookupError) {
        logger.error(`No ${this.resource} record found with ID ${id}`);
      }

      if (!recordToRemove || (recordToRemove && !recordToRemove.id)) {
        throw new RecordNotFoundException(id);
      } else {
        logger.debug(`Removing ${this.resource} with ID ${id} from the database`);
        recordToRemove.archived = true;
        await roleRepository.remove(recordToRemove);

        // log event to central handler
        const ended: number = Date.now();
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: {id, type: ObjectType.Role},
          resource: this.resource,
          timestamp: ended,
          took: ended - started,
          type: action,
        });

        logger.info(`Removed ${this.resource} with ID ${id} from the database`);
        return true;
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public getPermissions = async (user: User, id: string):
            Promise<User | RecordNotFoundException | UserNotAuthorizedException> => {
    if (!user || !id) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const roleRepository: Repository<Role> = getConnection().getRepository(Role);

    const record = await roleRepository.findOne(id, { relations: ["permissions"] });

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.READ;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.rolePermissionResource);

    if (permission.granted) {
      if (!record) {
        throw new RecordNotFoundException(id);
      } else {
        // log event to central handler
        const ended: number = Date.now();
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: null,
          resource: this.rolePermissionResource,
          target: {id, type: ObjectType.Role},
          timestamp: ended,
          took: ended - started,
          type: action,
        });

        return permission.filter(record.permissions);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.rolePermissionResource);
    }
  }

  public addPermission = async (user: User, id: string, data: any):
            Promise<Role | RecordNotFoundException | UserNotAuthorizedException> => {
    if (!user || !id || !data) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const roleRepository: Repository<Role> = getConnection().getRepository(Role);
    const permissionRepository: Repository<Permission> = getConnection().getRepository(Permission);

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.CREATE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.rolePermissionResource);

    if (permission.granted) {
      try {
        const permissionToAdd: Permission = await permissionRepository.save(data);
        const lap: number = Date.now();
        event.emit(ActivityType.CREATE, {
          actor: {id: user.id, type: ActorType.Person},
          object: {...permissionToAdd, type: ObjectType.Permission},
          resource: this.rolePermissionResource,
          timestamp: lap,
          took: lap - started,
          type: ActivityType.CREATE,
        });

        const recordToUpdate = await roleRepository.findOne(id, { relations: ["permissions"] });

        if (permissionToAdd && recordToUpdate) {
          try {
            await roleRepository
            .createQueryBuilder()
            .relation(Role, "permissions")
            .of({ id: recordToUpdate.id })
            .add([permissionToAdd]);

            // add new permission into object before returning
            recordToUpdate.permissions.push(permissionToAdd);
          } catch (relationError) {
            // catch duplicate key error just in case but confirm
            logger.error(relationError.message);
          }

          // log event to central handler
          const ended: number = Date.now();
          event.emit(ActivityType.ADD, {
            actor: {id: user.id, type: ActorType.Person},
            object: {id: permissionToAdd.id, type: ObjectType.Permission},
            resource: this.rolePermissionResource,
            target: {id, type: ObjectType.Role},
            timestamp: ended,
            took: ended - started,
            type: ActivityType.ADD,
          });

          logger.info(`Added ${this.rolePermissionResource} with ID ${permissionToAdd.id} to role ${id}`);
          return permission.filter(recordToUpdate);
        } else {
          throw new RecordNotFoundException(id);
        }
      } catch (saveError) {
        logger.error(`Error trying to add permission to role ${id}`);
        throw saveError;
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.rolePermissionResource);
    }
  }

  public removePermission = async (user: User, id: string, permissionId: string):
            Promise<Role | RecordNotFoundException | UserNotAuthorizedException> => {
    if (!user || !id || !permissionId) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const roleRepository: Repository<Role> = getConnection().getRepository(Role);

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.rolePermissionResource);

    if (permission.granted) {
      const recordToUpdate = await roleRepository.findOne(id, { relations: ["permissions"] });

      if (recordToUpdate) {
        try {
          await roleRepository
          .createQueryBuilder()
          .relation(Role, "permissions")
          .of(recordToUpdate)
          .remove([{ id: permissionId }]);

          // remove permission from return object
          recordToUpdate.permissions = recordToUpdate.permissions.filter((perm) => perm.id !== permissionId);
        } catch (relationError) {
          logger.error(relationError.message);
        }

        // log event to central handler
        // TODO: should we fire DELETE activity too?
        const ended: number = Date.now();
        event.emit(ActivityType.REMOVE, {
          actor: {id: user.id, type: ActorType.Person},
          object: {id: permissionId, type: ObjectType.Permission},
          resource: this.rolePermissionResource,
          target: {id, type: ObjectType.Role},
          timestamp: ended,
          took: ended - started,
          type: ActivityType.REMOVE,
        });

        logger.info(`Removed ${this.rolePermissionResource} with ID ${permissionId} from user ${id}`);
        return permission.filter(recordToUpdate);
      } else {
        throw new RecordNotFoundException(id);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.rolePermissionResource);
    }
  }

}

export default RoleDao;
