import { getConnection, Repository } from "typeorm";
import logger from "../../config/logger";

import Dao from "../../interfaces/dao.interface";
import { Activity, ActivityType, ActorType, ObjectType } from "../../interfaces/activitystream.interface";
import SearchResult from "../../interfaces/searchresult.interface";
import URLParams from "../../interfaces/urlparams.interface";
import { ActivityRelation, RelationAction } from "../../interfaces/graph.interface";

import DuplicateRecordException from "../../exceptions/DuplicateRecordException";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";
import RecordsNotFoundException from "../../exceptions/RecordsNotFoundException";
import NotImplementedException from "../../exceptions/NotImplementedException";
import MissingParametersException from "../../exceptions/MissingParametersException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";

import { event } from "../../utils/activity.helper";
import { AuthPermission, getPermission } from "../../utils/authorization.helper";
import { DataType, Formatter } from "../../utils/formatter";
import { refreshFlags } from "../../utils/flag.helper";

import { User } from "../user/user.entity";
import { Flag } from "./flag.entity";
import CreateFlagDto from "./flag.dto";

/**
 * Handles CRUD operations on Flag data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class FlagDao implements Dao {
  private resource: string = "flag"; // matches defined flag flag "resource"

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
    const flagRepository: Repository<Flag> = getConnection().getRepository(Flag);

    const records = await flagRepository.find({ relations: ["segments", "goals"] });

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
            Promise<Flag | RecordNotFoundException | UserNotAuthorizedException> => {
    if (!user || !id) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const flagRepository: Repository<Flag> = getConnection().getRepository(Flag);

    logger.debug(`Fetching ${this.resource} with ID ${id}`);
    const record = await flagRepository.findOne(id, { relations: ["segments", "goals"] });

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
          object: {id, type: ObjectType.Flag},
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
            Promise<Flag | RecordNotFoundException | UserNotAuthorizedException> => {
    if (!user || !data) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const flagRepository: Repository<Flag> = getConnection().getRepository(Flag);
    const newRecord: CreateFlagDto = data;

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.CREATE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      try {
        const filteredData: Flag = permission.filter(newRecord);
        const savedData: Flag = await flagRepository.save(filteredData);

        // update cache
        await refreshFlags();

        // log event to central handler
        const ended: number = Date.now();
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: {...savedData, type: ObjectType.Flag},
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
            Promise<Flag | RecordNotFoundException | UserNotAuthorizedException> => {
    if (!user || !data) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const flagRepository: Repository<Flag> = getConnection().getRepository(Flag);

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.UPDATE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const recordToUpdate = await flagRepository.findOne(data.id);

      if (recordToUpdate) {
        try {
          const savedData: Flag = flagRepository.merge(new Flag(), recordToUpdate, permission.filter(data));
          const updateResult: any = await flagRepository.update({ id: data.id }, savedData);

          // update cache
          await refreshFlags();

          // log event to central handler
          const ended: number = Date.now();
          event.emit(action, {
            actor: {id: user.id, type: ActorType.Person},
            object: {...savedData, type: ObjectType.Flag},
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
    const flagRepository: Repository<Flag> = getConnection().getRepository(Flag);
    const recordToRemove = await flagRepository.findOne(id);

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.DELETE;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      if (recordToRemove) {
        recordToRemove.archived = true;
        await flagRepository.update({ id }, recordToRemove);

        // update cache
        await refreshFlags();

        // log event to central handler
        const ended: number = Date.now();
        event.emit(action, {
          actor: {id: user.id, type: ActorType.Person},
          object: {id, type: ObjectType.Flag},
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

}

export default FlagDao;
