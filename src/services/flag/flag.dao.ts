import { getRepository, Repository } from "typeorm";
import event from "../../config/event";
import logger from "../../config/logger";
import Dao from "../../interfaces/dao.interface";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";
import RecordsNotFoundException from "../../exceptions/RecordsNotFoundException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import { AuthPermission, getPermission, methodActions } from "../../utils/authorization.helper";

import { User } from "../user/user.entity";
import { Flag } from "./flag.entity";
import CreateFlagDto from "./flag.dto";

/**
 * Handles CRUD operations on Flag data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class FlagDao implements Dao {
  private resource: string = "flag"; // matches defined flag flag "resource"
  private flagRepository: Repository<Flag> = getRepository(Flag);

  constructor() {
    // nothing
  }

  public getAll = async (user: User, params?: {[key: string]: any}):
            Promise<Flag[] | RecordsNotFoundException | UserNotAuthorizedException> => {
    const records = await this.flagRepository.find({ relations: ["segments", "goals"] });

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
            Promise<Flag | RecordNotFoundException | UserNotAuthorizedException> => {
    logger.info(`Fetching ${this.resource} with ID ${id}`);
    const record = await this.flagRepository.findOne(id, { relations: ["segments", "goals"] });

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
            Promise<Flag | RecordNotFoundException | UserNotAuthorizedException> => {
    const newRecord: CreateFlagDto = data;

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.POST;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const filteredData: Flag = permission.filter(newRecord);
      await this.flagRepository.save(filteredData);

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
    const recordToRemove = await this.flagRepository.findOne(id);

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (recordToRemove) {
        recordToRemove.archived = true;
        await this.flagRepository.save(recordToRemove);

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

}

export default FlagDao;
