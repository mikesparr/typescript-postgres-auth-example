import { getRepository, Repository } from "typeorm";
import event from "../../config/event";
import logger from "../../config/logger";
import Dao from "../../interfaces/dao.interface";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";
import RecordsNotFoundException from "../../exceptions/RecordsNotFoundException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import { AuthPermission, getPermission, methodActions } from "../../utils/authorization.helper";

import { User } from "../../services/user/user.entity";
import { Role } from "./role.entity";
import { Permission } from "../../services/permission/permission.entity";
import PermissionDto from "../permission/permission.dto";
import CreateRoleDto from "./role.dto";

/**
 * Handles CRUD operations on Role data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class RoleDao implements Dao {
  private resource: string = "role"; // matches defined role role "resource"
  private rolePermissionResource: string = "rolepermission";
  private roleRepository: Repository<Role> = getRepository(Role);
  private permissionRepository: Repository<Permission> = getRepository(Permission);

  constructor() {
    // nothing
  }

  public getAll = async (user: User, params?: {[key: string]: any}):
            Promise<Role[] | RecordsNotFoundException | UserNotAuthorizedException> => {
    const records = await this.roleRepository.find({ relations: ["permissions"] });

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
            Promise<Role | RecordNotFoundException | UserNotAuthorizedException> => {
    const record = await this.roleRepository.findOne(id, { relations: ["permissions"] });

    const isOwnerOrMember: boolean = false;
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
            Promise<Role | RecordNotFoundException | UserNotAuthorizedException> => {
    const newRecord: CreateRoleDto = data;

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.POST;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const filteredData: Role = permission.filter(newRecord);
      await this.roleRepository.save(filteredData);

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
    const recordToRemove = await this.roleRepository.findOne(id);

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (recordToRemove) {
        await this.roleRepository.remove(recordToRemove);

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

  public getPermissions = async (user: User, id: string | number):
            Promise<User | RecordNotFoundException | UserNotAuthorizedException> => {
    const record = await this.roleRepository.findOne(id, { relations: ["permissions"] });

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.GET;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.rolePermissionResource);

    if (permission.granted) {
      if (!record) {
        throw new RecordNotFoundException(id);
      } else {
        // log event to central handler
        event.emit("read-all", {
          action,
          actor: user,
          object: record.permissions,
          resource: this.rolePermissionResource,
          target: record,
          timestamp: Date.now(),
          verb: "read-all",
        });

        return permission.filter(record.permissions);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.rolePermissionResource);
    }
  }

  public addPermission = async (user: User, id: number, data: any):
            Promise<Role | RecordNotFoundException | UserNotAuthorizedException> => {
    const newRecord: Permission = data;

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.POST;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.rolePermissionResource);

    if (permission.granted) {
      const recordToUpdate = await this.roleRepository.findOne(id, { relations: ["permissions"] });

      if (recordToUpdate) {
        recordToUpdate.permissions.push(newRecord);

        const filteredData: Role = permission.filter(recordToUpdate);
        await this.roleRepository.save(recordToUpdate);

        // log event to central handler
        event.emit("add-user-permission", {
          action,
          actor: user,
          object: newRecord,
          resource: this.rolePermissionResource,
          target: recordToUpdate,
          timestamp: Date.now(),
          verb: "add-user-permission",
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

  public removePermission = async (user: User, id: number, permissionId: string):
            Promise<Role | RecordNotFoundException | UserNotAuthorizedException> => {

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.DELETE;
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
        event.emit("remove-user-permission", {
          action,
          actor: user,
          object: removedItem,
          resource: this.rolePermissionResource,
          target: recordToUpdate,
          timestamp: Date.now(),
          verb: "remove-user-permission",
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
