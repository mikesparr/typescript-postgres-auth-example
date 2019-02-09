import { classToPlain } from "class-transformer";
import logger from "../../config/logger";
import event from "../../config/event";
import email from "../../config/email";
import { validateDto } from "../../utils/validation.helper";

import EmailDeliveryException from "../../exceptions/EmailDeliveryException";
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
        event.emit("send-email", {
          action: "create",
          actor: {id: "System"},
          object: message,
          resource: this.resource,
          timestamp: ended,
          took: ended - started,
          verb: "send-email",
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
