import { getConnection, getRepository, Repository } from "typeorm";
import event from "../../config/event";
import logger from "../../config/logger";
import Dao from "../../interfaces/dao.interface";
import { DataType, Formatter } from "../../utils/formatter";
import SearchResult from "../../interfaces/searchresult.interface";
import URLParams from "../../interfaces/urlparams.interface";
import NotImplementedException from "../../exceptions/NotImplementedException";
import RecordNotFoundException from "../../exceptions/RecordNotFoundException";
import RecordsNotFoundException from "../../exceptions/RecordsNotFoundException";
import UserNotAuthorizedException from "../../exceptions/UserNotAuthorizedException";
import { AuthPermission, getPermission, methodActions } from "../../utils/authorization.helper";
import CreateRelationDto from "./relation.dto";
import { relationMap } from "../../utils/graph.helper";

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
    const action: string = methodActions.GET;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const records: Relation[] = await this.relationRepository.find();

      if (!records) {
        throw new RecordsNotFoundException(this.resource);
      } else {
        // log event to central handler
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
          data: permission.filter(records),
          length: records.length,
          total: records.length,
        };
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public save = async (user: User, data: any):
            Promise<object> => {
    const started: number = Date.now();

    const isOwnerOrMember: boolean = false;
    const action: string = methodActions.POST;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      try {
        logger.info(`Saving relation ${JSON.stringify(data)}`);
        // save bi-directional relation (2 records)
        await getConnection().manager.transaction(async (manager) => {
          const sourceRel: Relation = this.relationRepository.create({
            created: this.fmt.format(Date.now(), DataType.DATE),
            ...data as CreateRelationDto,
          });

          // add bi-directional relationship
          const targetRel: Relation = this.relationRepository.create({
            created: this.fmt.format(Date.now(), DataType.DATE),
            relation: relationMap[sourceRel.relation].target,
            sourceId: sourceRel.targetId,
            sourceType: sourceRel.targetType,
            targetId: sourceRel.sourceId,
            targetType: sourceRel.sourceType,
          });

          await manager.save(sourceRel);
          await manager.save(targetRel);
        });

        // log event to central handler
        const ended: number = Date.now();

        event.emit("save", {
          action,
          actor: user,
          object: data,
          resource: this.resource,
          timestamp: ended,
          took: ended - started,
          verb: "save",
        });

        data.id = "test";
        return data;
      } catch (error) {
        logger.error(error.message);
        throw new Error("Sum ting wong");
      }
    } else {
      throw new UserNotAuthorizedException(user.id, action, this.resource);
    }
  }

  public remove = async (user: User, id: string):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("remove");
  }

  /**
   * Just to satisfy interface requirements, but not used for Authentication
   */
  public getOne = async (user: User, id: string):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("getOne");
  }
  /**
   * END unused methods
   */

}

export default RelationDao;
