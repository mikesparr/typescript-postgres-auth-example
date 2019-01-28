import { getRepository, Repository } from "typeorm";
import logger from "../../config/logger";
import AuthPermission from '../../interfaces/permission.interface';
import Dao from '../../interfaces/dao.interface';
import RecordNotFoundException from '../../exceptions/RecordNotFoundException';
import RecordsNotFoundException from '../../exceptions/RecordsNotFoundException';
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import { methodActions, getPermission } from "../../utils/authorization.helper";

import { User } from "../../services/user/user.entity";
import { Permission } from "./permission.entity";
import CreatePermissionDto from "./permission.dto";

/**
 * Handles CRUD operations on Permission data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class PermissionDao implements Dao {
  private resource: string = "permission"; // matches defined role permission 'resource'
  private permissionRepository: Repository<Permission> = getRepository(Permission);

  constructor() {
  }

  public getAll = async (user: User, params?: {[key: string]: any}): 
            Promise<Permission[] | RecordsNotFoundException | UserNotAuthorizedException> => {
    const records = await this.permissionRepository.find();
    
    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.GET;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (!records) {
        throw new RecordsNotFoundException(this.resource);
      } else {
        return permission.filter(records);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public getOne = async (user: User, id: string | number): 
            Promise<Permission | RecordNotFoundException | UserNotAuthorizedException> => {
    const record = await this.permissionRepository.findOne(id);

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.GET;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (!record) {
        throw new RecordNotFoundException(id);
      } else {
        return permission.filter(record);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public save = async (user: User, data: any): 
            Promise<Permission | RecordNotFoundException | UserNotAuthorizedException> => {
    const newRecord: CreatePermissionDto = data;

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.POST;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const filteredData: Permission = permission.filter(newRecord);
      await this.permissionRepository.save(filteredData);

      logger.info(`Saved ${this.resource} with ID ${filteredData.id} in the database`);
      return filteredData;
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public remove = async (user: User, id: string | number): 
            Promise<boolean | RecordNotFoundException | UserNotAuthorizedException> => {
    const recordToRemove = await this.permissionRepository.findOne(id);

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (recordToRemove) {
        await this.permissionRepository.remove(recordToRemove);

        logger.info(`Removed ${this.resource} with ID ${id} from the database`);
        return true;
      } else {
        throw new RecordNotFoundException(id);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

}

export default PermissionDao;
