import { User } from "../user/user.entity";

/**
 * Data object with annotations to configure database in ORM
 */
export class Event {

  public id?: string; // unique id of event (immutable so not critical)

  public type: string; // descriptor of action taken

  public actor: User; // individual or {id: "System"} performing the action

  public origin?: {[key: string]: any}; // optional if changing state from and to something

  public object?: {[key: string]: any}; // main payload of event if not transitive

  public target?: {[key: string]: any}; // optional if performing action against something

  public result?: {[key: string]: any}; // optional if performing action against something

  public instrument?: {[key: string]: any}; // optional if one or more objects used to perform activity

  public timestamp: number; // unix timestamp with millis

  public published?: Date; // human-readable ISO 8601 format

  public action: string; // CRUD action taken: create, update, delete, read

  public resource: string; // type of resource action taken upon (i.e. flag)

  public host?: string; // server hostname to track which instance

  public took?: number; // milliseconds to process

  public count?: number; // used for quantifying number of events in aggregtion or over time

}

export default Event;
