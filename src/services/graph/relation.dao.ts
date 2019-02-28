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
import { actionToRelationMap, getEventRelation } from "../../utils/graph.helper";

import CreateRelationDto from "./relation.dto";
import { User } from "../user/user.entity";
import { Relation } from "./relation.entity";

/**
 * Facilitate storing and retrieving bi-directional graph
 * relations between objects or nodes
 */
class RelationDao implements Dao {
  private resource: string = "relation"; // matches defined flag flag "resource"
  private fmt: Formatter;

  constructor() {
    this.fmt = new Formatter();
  }

  public getAll = async (user: User, params?: URLParams):
            Promise<SearchResult> => {
    if (!user) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const started: number = Date.now();
    const relationRepository: Repository<Relation> = getConnection().getRepository(Relation);

    const isOwnerOrMember: boolean = false;
    const action: string = ActivityType.READ;
    const permission: AuthPermission = await getPermission(user, isOwnerOrMember, action, this.resource);

    if (permission.granted) {
      const records: Relation[] = await relationRepository.find({archived: false});

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

  public updateGraphFromEvent = async (data: any): Promise<void> => {
    if (!data) {
      const message: string = "Required parameters missing";
      throw new MissingParametersException(message);
    }

    const relationRepository: Repository<Relation> = getConnection().getRepository(Relation);

    try {
      const jobs: Array<Promise<any>> = [];

      // get relations for event, then loop through them and build object
      actionToRelationMap[data.type].forEach(async (template: ActivityRelation) => {
        const editRelation: boolean = data.hasOwnProperty(template.from) &&
                data.hasOwnProperty(template.to) &&
                data[template.from] !== null && data[template.to] !== null &&
                data[template.from].type && data[template.to].type;

        if (editRelation) {
          let relationToSave: Relation = getEventRelation(template, data);
          if (template.type === RelationAction.REMOVE) {
            try {
              const foundRelation: Relation = await relationRepository.findOne(relationToSave);
              if (foundRelation) {
                relationToSave = relationRepository.merge(relationToSave, foundRelation);
              }
            } catch (error) {
              logger.error(`Error finding relation ${JSON.stringify(relationToSave)}`);
            }

            relationToSave.archived = true; // set true regardless
          }

          // add created if doesn't exist
          relationToSave.created = relationToSave.created ?
                relationToSave.created : this.fmt.format(Date.now(), DataType.DATE);

          jobs.push( relationRepository.save(relationToSave) );
        }
      });

      Promise.all(jobs)
        .then((results) => {
          logger.debug(`Edited ${results.length} relations`);
        })
        .catch((error) => {
          logger.error(`------- ${error.message} --------`);
        });
    } catch (error) {
      throw new Error(`OOPSY with event: ${JSON.stringify(data)}`);
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

  public update = async (user: User, data: any):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("update");
  }

  public remove = async (user: User, id: string):
            Promise<NotImplementedException> => {
    throw new NotImplementedException("remove");
  }
  /**
   * END unused methods
   */

}

export default RelationDao;
