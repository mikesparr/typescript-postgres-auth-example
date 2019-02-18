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

import { getPlaces } from "./provider/OpenCageDataProvider";
import { User } from "../user/user.entity";

/**
 * Example external API interaction searching geo service
 */
class SearchDao implements Dao {
  private resource: string = "search";

  constructor() {
    // nothing
  }

  public getPlacesByName = async (user: User, query: string):
          Promise<SearchResult> => {
    if (!user || !query) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.READ;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const records: {[key: string]: any} = await getPlaces(query);

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

  /**
   * Just to satisfy interface requirements, but not used for Authentication
   */
  public getAll = async (user: User, params?: {[key: string]: any}):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("getAll");
  }

  public getOne = async (user: User, id: string):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("getOne");
  }

  public save = async (user: User, data: any):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("save");
  }

  public remove = async (user: User, id: string):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("remove");
  }
}

export default SearchDao;
