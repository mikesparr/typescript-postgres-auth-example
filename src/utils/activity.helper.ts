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

  // log events in document database (optionally filter by type or whatever)
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
event.on(ActivityType.INVITE, handleEvent);
event.on(ActivityType.ACCEPT, handleEvent);
event.on(ActivityType.REJECT, handleEvent);
event.on(ActivityType.ARRIVE, handleEvent);
event.on(ActivityType.JOIN, handleEvent);
event.on(ActivityType.LEAVE, handleEvent);
event.on(ActivityType.ADD, handleEvent);
event.on(ActivityType.REMOVE, handleEvent);
// global CRUD
event.on(ActivityType.CREATE, handleEvent);
event.on(ActivityType.READ, handleEvent);
event.on(ActivityType.UPDATE, handleEvent);
event.on(ActivityType.DELETE, handleEvent);
event.on(ActivityType.VIEW, handleEvent);
