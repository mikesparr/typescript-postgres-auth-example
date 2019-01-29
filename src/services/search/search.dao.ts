import event from "../../config/event";
import logger from "../../config/logger";

import NotImplementedException from "../../exceptions/NotImplementedException";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";
import Dao from "../../interfaces/dao.interface";
import RecordsNotFoundException from "../../exceptions/RecordsNotFoundException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";

import { AuthPermission, getPermission, methodActions } from "../../utils/authorization.helper";

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

  public getPlacesByName = async (user: User, query: string) => {

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.GET;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const records: {[key: string]: any} = await getPlaces(query);

      if (!records) {
        throw new RecordsNotFoundException(this.resource);
      } else {
        // log event to central handler
        event.emit("search", {
          action,
          actor: user,
          object: records,
          resource: this.resource,
          timestamp: Date.now(),
          verb: "search",
        });

        return permission.filter(records);
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

  public getOne = async (user: User, id: string | number):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("getOne");
  }

  public save = async (user: User, data: any):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("save");
  }

  public remove = async (user: User, id: string | number):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("remove");
  }
}

export default SearchDao;
