import { classToPlain } from "class-transformer";
import uuid from "uuid/v1";
import { getConnection, Repository } from "typeorm";
import logger from "../../config/logger";
import email from "../../config/email";

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
import EmailDeliveryException from "../../exceptions/EmailDeliveryException";

import { event } from "../../utils/activity.helper";
import { AuthPermission, getPermission } from "../../utils/authorization.helper";
import { DataType, Formatter } from "../../utils/formatter";
import { validateDto } from "../../utils/validation.helper";

import EmailDto from "./email.dto";

class Email {
  private resource: string = "email";

  constructor() {
    // none
  }

  public send = async (message: EmailDto): Promise<boolean | Error> => {
    const started: number = Date.now();

    // validate message
    try {
      const isValid: boolean | Error = await validateDto(EmailDto, message, true);
      logger.info(`Sending email to ${message.to}`);

      // send message
      try {
        const result: any = await email.send(classToPlain(message) as any);
        logger.info(`Email to ${message.to} sent successfully`);

        // log event to central handler
        const ended: number = Date.now();
        event.emit(ActivityType.CREATE, {
          actor: {id: "System", type: ActorType.Application},
          object: {id: uuid(), ...message, type: ObjectType.Message},
          resource: this.resource,
          timestamp: ended,
          took: ended - started,
          type: ActivityType.CREATE,
        });

        return true;
      } catch (error) {
        logger.error(error.message);
        throw new EmailDeliveryException(message.to);
      }
    } catch (validationError) {
      throw validationError;
    }
  }
}

export default Email;
