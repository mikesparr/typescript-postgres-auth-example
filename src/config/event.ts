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
  logger.debug(JSON.stringify(data));
};

event.on("register", handleEvent);
event.on("verify", handleEvent);
event.on("reissue", handleEvent);
event.on("lost-password", handleEvent);
event.on("login", handleEvent);
// TODO: add failed-login for future monitoring/alerting
event.on("logout", handleEvent);
event.on("read-tokens", handleEvent);
event.on("read-user-flags", handleEvent);
event.on("remove-token", handleEvent);
event.on("remove-user-tokens", handleEvent);
event.on("add-user-role", handleEvent);
event.on("add-role-permission", handleEvent);
event.on("remove-user-role", handleEvent);
event.on("remove-role-permission", handleEvent);
// global CRUD
event.on("read-all", handleEvent);
event.on("read-one", handleEvent);
event.on("save", handleEvent);
event.on("remove", handleEvent);
event.on("search", handleEvent);
event.on("send-email", handleEvent);

export default event;
