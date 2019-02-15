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
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";

import { event } from "../../utils/activity.helper";
import { AuthPermission, getPermission } from "../../utils/authorization.helper";
import { DataType, Formatter } from "../../utils/formatter";
import { getAll } from "../../utils/document.helper";

import { User } from "../user/user.entity";

/**
 * Handles CRUD operations on Flag data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class ActivityDao implements Dao {
  private resource: string = "activity"; // matches defined flag flag "resource"
  private docIndex: string = "activities";
  private docType: string = "_doc";

  constructor() {
    // nothing
  }

  public getAll = async (user: User, params?: URLParams):
            Promise<SearchResult> => {
    const started: number = Date.now();

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.READ;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const query: any = {
        match_all: {},
      };

      const searchParams: any = {};
      if (params) {
        if (params.limit) {
          searchParams.size = params.limit;
        }
        if (params.offset) {
          searchParams.from = params.offset;
        }
        if (params.q) {
          searchParams.q = params.q;
        }
        if (params.from) {
          searchParams.start = params.from;
        }
        if (params.to) {
          searchParams.end = params.to;
        }
        if (params.sort) {
          searchParams.sort = params.sort;
        }
      }

      const records: SearchResult = await getAll(this.docIndex, query, searchParams);

      if (!records) {
        throw new RecordsNotFoundException(this.resource);
      } else {
        // log activity to central handler
        user.password = undefined;
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
          data: permission.filter(records.data),
          length: records.length,
          total: records.total,
        };
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  /**
   * Just to satisfy interface requirements, but not used for Authentication
   */
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
  /**
   * END unused methods
   */

}

export default ActivityDao;
