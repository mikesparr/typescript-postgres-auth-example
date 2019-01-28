import { getRepository, Repository } from "typeorm";
import logger from "../../config/logger";
import AuthPermission from '../../interfaces/permission.interface';
import Dao from '../../interfaces/dao.interface';
import RecordNotFoundException from '../../exceptions/RecordNotFoundException';
import RecordsNotFoundException from '../../exceptions/RecordsNotFoundException';
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import { methodActions, getPermission } from "../../utils/authorization.helper";

import { User } from "../../services/user/user.entity";
import { Role } from "./role.entity";
import CreateRoleDto from "./role.dto";

/**
 * Handles CRUD operations on Role data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class RoleDao implements Dao {
  private resource: string = "role"; // matches defined role role 'resource'
  private roleRepository: Repository<Role> = getRepository(Role);

  constructor() {
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

      logger.info(`Saved ${this.resource} with ID ${filteredData.id} in the databse`);
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

        logger.info(`Removed ${this.resource} with ID ${id} from the databse`);
        return true;
      } else {
        throw new RecordNotFoundException(id);
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

}

export default RoleDao;
