import { EventEmitter } from "events";
import logger from "./logger";

/**
 * Event emitter that can allow handling of application events
 * (i.e. - audit logging, CQRS-ES architecture, etc)
 * imports are cached so this should be a singleton used
 * throughout app
 */
const event = new EventEmitter();

/**
 * Example handler but could register a handler and array of events with App
 * and publish to a queue for async processing. Could also flag whether to
 * save or update data in local DB.
 */
const handleEvent = (data: {[key: string]: any}) => {
  logger.info(JSON.stringify(data));
};

event.on("register", handleEvent);
event.on("login", handleEvent);
event.on("logout", handleEvent);
event.on("read-all", handleEvent);
event.on("read-one", handleEvent);
event.on("save", handleEvent);
event.on("remove", handleEvent);
event.on("search", handleEvent);
event.on("send-email", handleEvent);

export default event;
