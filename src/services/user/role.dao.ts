import { getRepository, Repository } from "typeorm";
import { ActivityType, event } from "../../utils/activity.helper";
import logger from "../../config/logger";
import Dao from "../../interfaces/dao.interface";
import SearchResult from "../../interfaces/searchresult.interface";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";
import RecordsNotFoundException from "../../exceptions/RecordsNotFoundException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import { AuthPermission, getPermission } from "../../utils/authorization.helper";

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
  private roleRepository: Repository<Role> = getRepository(Role);

  constructor() {
    // nothing
  }

  public getAll = async (user: User, params?: {[key: string]: any}):
            Promise<SearchResult> => {
    const started: number = Date.now();
    const records = await this.roleRepository.find({ relations: ["permissions"] });

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
          actor: user,
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
    const started: number = Date.now();
    const record = await this.roleRepository.findOne(id, { relations: ["permissions"] });

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
          actor: user,
          object: {id: record.id},
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
    const started: number = Date.now();
    const newRecord: CreateRoleDto = data;

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.CREATE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const filteredData: Role = permission.filter(newRecord);
      await this.roleRepository.save(filteredData);

      // log event to central handler
      const ended: number = Date.now();
      event.emit(action, {
        actor: user,
        object: filteredData,
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
    const recordToRemove = await this.roleRepository.findOne(id);

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (recordToRemove) {
        await this.roleRepository.remove(recordToRemove);

        // log event to central handler
        const ended: number = Date.now();
        event.emit(action, {
          actor: user,
          object: {id},
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

  public getPermissions = async (user: User, id: string):
            Promise<User | RecordNotFoundException | UserNotAuthorizedException> => {
    const started: number = Date.now();
    const record = await this.roleRepository.findOne(id, { relations: ["permissions"] });

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
          actor: user,
          object: null,
          resource: this.rolePermissionResource,
          target: record,
          timestamp: ended,
          took: ended - started,
          verb: action,
        });

        return permission.filter(record.permissions);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.rolePermissionResource);
    }
  }

  public addPermission = async (user: User, id: string, data: any):
            Promise<Role | RecordNotFoundException | UserNotAuthorizedException> => {
    const started: number = Date.now();
    const newRecord: Permission = data;

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.CREATE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.rolePermissionResource);

    if (permission.granted) {
      const recordToUpdate = await this.roleRepository.findOne(id, { relations: ["permissions"] });

      if (recordToUpdate) {
        recordToUpdate.permissions.push(newRecord);

        const filteredData: Role = permission.filter(recordToUpdate);
        await this.roleRepository.save(recordToUpdate);

        // log event to central handler
        const ended: number = Date.now();
        event.emit(ActivityType.ADD, {
          actor: user,
          object: newRecord,
          resource: this.rolePermissionResource,
          target: recordToUpdate,
          timestamp: ended,
          took: ended - started,
          type: ActivityType.ADD,
        });

        logger.info(`Added ${this.rolePermissionResource} with ID ${newRecord.action} to role ${recordToUpdate.id}`);
        return filteredData;
      } else {
        throw new RecordNotFoundException(id);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.rolePermissionResource);
    }
  }

  public removePermission = async (user: User, id: string, permissionId: string):
            Promise<Role | RecordNotFoundException | UserNotAuthorizedException> => {
    const started: number = Date.now();

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.rolePermissionResource);

    if (permission.granted) {
      const recordToUpdate = await this.roleRepository.findOne(id, { relations: ["permissions"] });

      if (recordToUpdate) {
        // check if relation already exists
        let removedItem: Permission;
        const updatedPermissions: Permission[] = [];
        for (const relation of recordToUpdate.permissions) {
          if (String(relation.id) === String(permissionId)) {
            removedItem = relation;
          } else {
            updatedPermissions.push(relation);
          }
        }

        // if it doesn't exist, add it to record and save update to database
        if (removedItem) {
          recordToUpdate.permissions = updatedPermissions;
          await this.roleRepository.save(recordToUpdate);
        }

        const filteredData: Role = permission.filter(recordToUpdate);
        await this.roleRepository.save(recordToUpdate);

        // log event to central handler
        const ended: number = Date.now();
        event.emit(ActivityType.REMOVE, {
          actor: user,
          object: removedItem,
          resource: this.rolePermissionResource,
          target: recordToUpdate,
          timestamp: ended,
          took: ended - started,
          type: ActivityType.REMOVE,
        });

        logger.info(`Removed ${this.rolePermissionResource} with ID ${permissionId} from user ${id}`);
        return filteredData;
      } else {
        throw new RecordNotFoundException(id);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.rolePermissionResource);
    }
  }

}

export default RoleDao;
