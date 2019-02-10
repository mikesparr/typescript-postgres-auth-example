import { getRepository, Repository } from "typeorm";
import event from "../../config/event";
import logger from "../../config/logger";
import Dao from "../../interfaces/dao.interface";
import SearchResult from "../../interfaces/searchresult.interface";
import URLParams from "../../interfaces/urlparams.interface";
import NotImplementedException from "../../exceptions/NotImplementedException";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";
import RecordsNotFoundException from "../../exceptions/RecordsNotFoundException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import { AuthPermission, getPermission, methodActions } from "../../utils/authorization.helper";
import { getAll } from "../../utils/document.helper";

import { User } from "../user/user.entity";
import { Event } from "./event.entity";

/**
 * Handles CRUD operations on Flag data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class EventDao implements Dao {
  private resource: string = "event"; // matches defined flag flag "resource"
  private docIndex: string = "events";
  private docType: string = "_doc";

  constructor() {
    // nothing
  }

  public getAll = async (user: User, params?: URLParams):
            Promise<SearchResult> => {
    const started: number = Date.now();

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.GET;
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
        // log event to central handler
        user.password = undefined;
        const ended: number = Date.now();

        event.emit("read-all", {
          action,
          actor: user,
          object: null,
          resource: this.resource,
          timestamp: ended,
          took: ended - started,
          verb: "read-all",
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

export default EventDao;
