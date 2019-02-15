/**
 * Standard ActvityStream embedded object
 */
export interface ActivityObject {
  id: string;
  type: string;
  [key: string]: any;
}

/**
 * Standard ActvityStream embedded Actor object
 */
export interface Actor {
  id: string;
  type: ActorType;
  [key: string]: any;
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

/**
 * Possible actor types per spec
 * https://www.w3.org/TR/activitystreams-vocabulary/#actor-types
 */
export enum ActorType {
  Application = "Application",
  Group = "Group",
  Organization = "Organization",
  Person = "Person",
  Service = "Service",
}

/**
 * Event types based on Activity Streams spec
 */
export enum ActivityType {
  ACCEPT              = "accept",
  ADD                 = "add",
  ANNOUNCE            = "announce",
  ARRIVE              = "arrive",
  BLOCK               = "block",
  CREATE              = "create",
  DELETE              = "delete",
  DISLIKE             = "dislike",
  FLAG                = "flag",
  FOLLOW              = "follow",
  IGNORE              = "ignore",
  INVITE              = "invite",
  JOIN                = "join",
  LEAVE               = "leave",
  LIKE                = "like",
  LISTEN              = "listen",
  MOVE                = "move",
  OFFER               = "offer",
  QUESTION            = "question",
  READ                = "read",
  REJECT              = "reject",
  REMOVE              = "remove",
  TENTATIVE_ACCEPT    = "tentativeAccept",
  TENTATIVE_REJECT    = "tentativeReject",
  TRAVEL              = "travel",
  UNDO                = "undo",
  UPDATE              = "update",
  VIEW                = "view",
}

/**
 * Potential object types for graph nodes or database entities
 */
export enum ObjectType {
  Activity          = "Activity",
  Address           = "Address",
  Application       = "Application", // computer program
  Assembly          = "Assembly",
  Building          = "Building",
  Cart              = "Cart",
  Category          = "Category", // aka Topic, Subject, EventType
  Comment           = "Comment",
  Country           = "Country",
  Deposit           = "Deposit",
  Dish              = "Dish",  // aka FoodItem
  District          = "District", // aka SchoolDistrict, HuntingDistrict
  Document          = "Document", // PatientRecord, EmployeeRecord, Agreement
  Equipment         = "Equipment",
  Event             = "Event", // aka Concert, Game, Meal, Listing, Showing, Closing
  Flag              = "Flag", // feature flag
  Goal              = "Goal", // feature flag metric
  Group             = "Group", // aka UserGroup, ProductGroup, Department, Team, EventClass
  Idea              = "Idea",
  Information       = "Information", // (i.e. secret)
  Ingredient        = "Ingredient",
  Instruction       = "Instruction",
  Inventory         = "Inventory",
  Item              = "Item", // aka LineItem, OrderItem, CartItem, ListItem
  Language          = "Language",
  Level             = "Level", // aka Floor (of building)
  Link              = "Link", // URL to something
  List              = "List", // aka TodoList, TaskList
  Locality          = "Locality", // aka City, Jurisdiction
  Location          = "Location",
  MediaItem         = "MediaItem", // aka File, Photo, Video
  Message           = "Message",
  Office            = "Office",
  Order             = "Order",
  Organization      = "Organization",
  Package           = "Package",
  Payment           = "Payment",
  Permission        = "Permission",
  Person            = "Person",
  Poll              = "Poll",
  Position          = "Position", // aka Job, Role
  Post              = "Post", // aka Article
  PostalCode        = "PostalCode",
  Product           = "Product",
  Property          = "Property", // aka RealEstate, Land
  Query             = "Query", // aka Search, Request
  Receipt           = "Receipt",
  Recipe            = "Recipe",
  Region            = "Region", // aka State, Province, HuntingRegion
  Role              = "Role",
  Room              = "Room",
  Segment           = "Segment", // feature flag user segmentation
  Shipment          = "Shipment",
  Skill             = "Skill",
  Step              = "Step",
  Subscription      = "Subscription",
  Task              = "Task",
  Token             = "Token",
  Ticket            = "Ticket",
  Unit              = "Unit",
  User              = "User",
  Variant           = "Variant",
  Venue             = "Venue",
  Vote              = "Vote",
  Worker            = "Worker",
  Workspace         = "Workspace", // aka Namespace, Project
}
