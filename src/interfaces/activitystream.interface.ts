/**
 * Standard ActvityStream embedded object
 */
export interface ActivityObject {
  id: string;
  type: string;
}

/**
 * Possible actor types per spec
 * https://www.w3.org/TR/activitystreams-vocabulary/#actor-types
 */
export enum ActorType {
  Application = "application",
  Group = "group",
  Organization = "organization",
  Person = "person",
  Service = "service",
}

/**
 * Standard ActvityStream embedded Actor object
 */
export interface Actor {
  id: string;
  type: ActorType;
}

/**
 * Standard ActvityStream event object
 */
export interface Activity {
  id?: string; // unique id of event (immutable so not critical)
  type: string; // descriptor of action taken
  actor: Actor; // individual or {id: "System"} performing the action
  origin?: ActivityObject; // optional if changing state from and to something
  object?: ActivityObject; // main payload of event if not transitive
  target?: ActivityObject; // optional if performing action against something
  result?: ActivityObject; // optional if performing action against something
  instrument?: ActivityObject; // optional if one or more objects used to perform activity
  timestamp: number; // unix timestamp with millis
  published?: Date; // human-readable ISO 8601 format
  resource: string; // type of resource action taken upon (i.e. flag)
  host?: string; // server hostname to track which instance
  took?: number; // milliseconds to process
  count?: number; // used for quantifying number of events in aggregtion or over time
  [key: string]: any;
}
