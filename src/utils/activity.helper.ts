import os from "os";
import { EventEmitter } from "events";
import logger from "../config/logger";
import { Activity, ActivityType } from "../interfaces/activitystream.interface";
import { DataType, Formatter } from "./formatter";

import { save } from "./document.helper";
import RelationDao from "../services/graph/relation.dao";

const ACTIVITY_INDEX = "activities";

export enum EventType {
  CACHE_HIT = "hit",
  CACHE_MISS = "miss",
}

/**
 * Event emitter that can allow handling of application events
 * (i.e. - audit logging, CQRS-ES architecture, etc)
 * imports are cached so this should be a singleton used
 * throughout app
 */
export const event = new EventEmitter();

/**
 * Formatter to standardize data before storing in DB
 */
const fmt: Formatter = new Formatter();

/**
 * Example handler but could register a handler and array of events with App
 * and publish to a queue for async processing. Could also flag whether to
 * save or update data in local DB.
 */
const handleEvent = async (data: Activity) => {
  // log events in document database (optionally filter by type or whatever)
  try {
    // add ISO published and hostname
    data.published = fmt.format(data.timestamp, DataType.DATE);
    data.host = os.hostname();
    data.count = 1;

    await save(ACTIVITY_INDEX, data);
  } catch (error) {
    logger.error(error.message);
  }

  // manage graph relations
  try {
    const relationDao: RelationDao = new RelationDao();
    await relationDao.updateGraphFromEvent(data);
  } catch (error) {
    logger.error(error.message);
  }
};

const logHitOrMiss = async (data: Activity) => {
  logger.info(JSON.stringify(data));
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
// analytics
event.on(EventType.CACHE_HIT, logHitOrMiss);
event.on(EventType.CACHE_MISS, logHitOrMiss);
