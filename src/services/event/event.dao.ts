import { getRepository, Repository } from "typeorm";
import event from "../../config/event";
import logger from "../../config/logger";
import Dao from "../../interfaces/dao.interface";
import NotImplementedException from "../../exceptions/NotImplementedException";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";
import RecordsNotFoundException from "../../exceptions/RecordsNotFoundException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import { AuthPermission, getPermission, methodActions } from "../../utils/authorization.helper";
import { getAll } from "../../utils/document.helper";

import { User } from "../user/user.entity";

/**
 * Handles CRUD operations on Flag data in database
 * Factoring to this class allows other (i.e. GraphQL to reuse this code in resolvers)
 */
class EventDao implements Dao {
  private resource: string = "event"; // matches defined flag flag "resource"

  constructor() {
    // nothing
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
  /**
   * END unused methods
   */

}

export default EventDao;
