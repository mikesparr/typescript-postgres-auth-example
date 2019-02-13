import { getConnection, getRepository, Repository } from "typeorm";
import { ActivityType, event } from "../../utils/activity.helper";
import logger from "../../config/logger";
import Dao from "../../interfaces/dao.interface";
import { DataType, Formatter } from "../../utils/formatter";
import SearchResult from "../../interfaces/searchresult.interface";
import URLParams from "../../interfaces/urlparams.interface";
import NotImplementedException from "../../exceptions/NotImplementedException";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";
import RecordsNotFoundException from "../../exceptions/RecordsNotFoundException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import { AuthPermission, getPermission } from "../../utils/authorization.helper";
import { actionToRelationMap } from "../../utils/graph.helper";
import CreateRelationDto from "./relation.dto";

import { User } from "../user/user.entity";
import { Relation } from "./relation.entity";

/**
 * Facilitate storing and retrieving bi-directional graph
 * relations between objects or nodes
 */
class RelationDao implements Dao {
  private resource: string = "relation"; // matches defined flag flag "resource"
  private relationRepository: Repository<Relation> = getRepository(Relation);
  private fmt: Formatter;

  constructor() {
    this.fmt = new Formatter();
  }

  public getAll = async (user: User, params?: URLParams):
            Promise<SearchResult> => {
    const started: number = Date.now();

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.READ;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const records: Relation[] = await this.relationRepository.find();

      if (!records) {
        throw new RecordsNotFoundException(this.resource);
      } else {
        // log event to central handler
        const ended: number = Date.now();

        event.emit(action, {
          actor: user,
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

  public updateGraphFromEvent = async (user: User, data: any):
            Promise<void> => {

    try {
      logger.info(`Saving relation ${JSON.stringify(data)}`);

      // initiate transaction so all relations save or none for integrity
      await getConnection().manager.transaction(async (manager) => {
        // get relations for event, then loop through them and build object
        actionToRelationMap[data.type].map(async (template: {[key: string]: any}) => {
          // TODO: check if type = "add" or "remove"
          const newRelation: Relation = this.getEventRelation(template, data);
          await manager.save(newRelation);
        });
      });

    } catch (error) {
      logger.error(error.message);
      throw new Error("Sum ting wong");
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

  private getEventRelation = (template: {[key: string]: any}, data: {[key: string]: any}): Relation => {
    return this.relationRepository.create({
      created: this.fmt.format(Date.now(), DataType.DATE),
      relation: template.relation,
      sourceId: data[template.from].id,
      sourceType: data[template.from].type,
      targetId: data[template.to].id,
      targetType: data[template.to].type,
    });
  }

}

export default RelationDao;
