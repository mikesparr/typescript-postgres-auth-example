import os from "os";
import { EventEmitter } from "events";
import logger from "../config/logger";
import Event from "../services/event/event.entity";
import { DataType, Formatter } from "./formatter";

import { save } from "./document.helper";

/**
 * Event emitter that can allow handling of application events
 * (i.e. - audit logging, CQRS-ES architecture, etc)
 * imports are cached so this should be a singleton used
 * throughout app
 */
export const event = new EventEmitter();

/**
 * Event types based on Activity Streams spec
 */
export enum ActivityType {
  ACCEPT = "accept",
  ADD = "add",
  ANNOUNCE = "announce",
  ARRIVE = "arrive",
  BLOCK = "block",
  CREATE = "create",
  DELETE = "delete",
  DISLIKE = "dislike",
  FLAG = "flag",
  FOLLOW = "follow",
  IGNORE = "ignore",
  INVITE = "invite",
  JOIN = "join",
  LEAVE = "leave",
  LIKE = "like",
  LISTEN = "listen",
  MOVE = "move",
  OFFER = "offer",
  QUESTION = "question",
  READ = "read",
  REJECT = "reject",
  REMOVE = "remove",
  TENTATIVE_ACCEPT = "tentativeAccept",
  TENTATIVE_REJECT = "tentativeReject",
  TRAVEL = "travel",
  UNDO = "undo",
  UPDATE = "update",
  VIEW = "view",
}

/**
 * Formatter to standardize data before storing in DB
 */
const fmt: Formatter = new Formatter();

/**
 * Remove sensitive data from records before logging or publishing
 */
const removeSensitiveData = (data: any): Event => {
  const { actor, object, target } = data;

  const removePassword = (obj: {[key: string]: any}, key: string) => {
    if (obj.hasOwnProperty("password")) {
      data[key].password = undefined;
    }
    if (obj.surrogatePrincipal && obj.surrogatePrincipal.password) {
      data[key].surrogatePrincipal.password = undefined;
    }
  };

  if (actor) {
    removePassword(actor, "actor");
  }
  if (target) {
    removePassword(target, "target");
  }

  return data;
};

/**
 * Example handler but could register a handler and array of events with App
 * and publish to a queue for async processing. Could also flag whether to
 * save or update data in local DB.
 */
const handleEvent = async (data: {[key: string]: any}) => {
  const cleanData: Event = removeSensitiveData(data);

  logger.debug(JSON.stringify(cleanData));

  // log events in document database (optionally filter by verb or whatever)
  try {
    // add ISO published and hostname
    cleanData.published = fmt.format(data.timestamp, DataType.DATE);
    cleanData.host = os.hostname();
    cleanData.count = 1;

    await save("events", cleanData);
  } catch (error) {
    logger.error(error.message);
  }
};

/**
 * Listen for events emitted from DAO methods and pass in handler
 */
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
event.on("search", handleEvent);
event.on("send-email", handleEvent);
// global CRUD
event.on("read-all", handleEvent);
event.on("read-one", handleEvent);
event.on("save", handleEvent);
event.on("remove", handleEvent);
