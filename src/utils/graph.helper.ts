/**
 * Utilities for bi-direction graph relations
 */

/**
 * Dynamically maintain graph relations based on Activity Stream
 *
 * Examples:
 *
 * CREATE: [
 *   {type: "add", from: "actor", to: "object", relation: "CREATED"},
 *   {type: "add", from: "object", to: "actor", relation: "CREATED_BY"},
 * ]
 *
 * INVITE: [
 *   {type: "add", from: "actor", to: "target", relation: "INVITED"},
 *   {type: "add", from: "target", to: "object", relation: "INVITED_TO"},
 *   {type: "add", from: "target", to: "actor", relation: "INVITED_BY"},
 *   {type: "add", from: "object", to: "target", relation: "INVITEE"},
 * ]
 *
 */
export const actionToRelationMap: {[key: string]: any} = {
  accept: [
    {type: "add", from: "actor", to: "object", relation: "ACCEPTED"},
    {type: "add", from: "object", to: "actor", relation: "ACCEPTED_BY"},
  ],
  add: [
    {type: "add", from: "actor", to: "object", relation: "CREATED"},
    {type: "add", from: "object", to: "actor", relation: "CREATED_BY"},
  ],
  announce: [
    {type: "add", from: "actor", to: "object"},
  ],
  arrive: [
    {type: "add", from: "actor", to: "object"},
  ],
  block: [
    {type: "add", from: "actor", to: "object"},
  ],
  create: [
    {type: "add", from: "actor", to: "object", relation: "CREATED"},
    {type: "add", from: "object", to: "actor", relation: "CREATED_BY"},
  ],
  delete: [
    {type: "add", from: "actor", to: "object", relation: "DELETED"},
    {type: "add", from: "object", to: "actor", relation: "DELETED_BY"},
  ],
  dislike: [
    {type: "add", from: "actor", to: "object", relation: "DISLIKED"},
    {type: "add", from: "object", to: "actor", relation: "DISLIKED_BY"},
  ],
  flag: [
    {type: "add", from: "actor", to: "object", relation: "FLAGGED"},
    {type: "add", from: "object", to: "actor", relation: "FLAGGED_BY"},
  ],
  follow: [
    {type: "add", from: "actor", to: "object", relation: "FOLLOWS"},
    {type: "add", from: "object", to: "actor", relation: "FOLLOWED_BY"},
  ],
  ignore: [
    {type: "add", from: "actor", to: "object", relation: "IGNORED"},
    {type: "add", from: "object", to: "actor", relation: "IGNORED_BY"},
  ],
  invite: [
    {type: "add", from: "actor", to: "target", relation: "INVITED"},
    {type: "add", from: "target", to: "object", relation: "INVITED_TO"},
    {type: "add", from: "target", to: "actor", relation: "INVITED_BY"},
    {type: "add", from: "object", to: "target", relation: "INVITEE"},
  ],
  join: [
    {type: "add", from: "actor", to: "object", relation: "MEMBER_OF"},
    {type: "add", from: "object", to: "actor", relation: "HAS_MEMBER"},
  ],
  leave: [
    {type: "remove", from: "actor", to: "object", relation: "MEMBER_OF"},
    {type: "remove", from: "object", to: "actor", relation: "HAS_MEMBER"},
    {type: "add", from: "actor", to: "object", relation: "PAST_MEMBER"},
    {type: "add", from: "object", to: "actor", relation: "FORMER_MEMBER"},
  ],
  like: [
    {type: "add", from: "actor", to: "object", relation: "LIKES"},
    {type: "add", from: "object", to: "actor", relation: "LIKED_BY"},
  ],
  listen: [
    {type: "add", from: "actor", to: "object"},
  ],
  move: [
    {type: "add", from: "actor", to: "object"},
  ],
  offer: [
    {type: "add", from: "actor", to: "object", relation: "OFFERED"},
    {type: "add", from: "object", to: "actor", relation: "OFFERED_BY"},
  ],
  question: [
    {type: "add", from: "actor", to: "object"},
  ],
  read: [
    {type: "add", from: "actor", to: "object", relation: "READ"},
    {type: "add", from: "object", to: "actor", relation: "READ_BY"},
  ],
  reject: [
    {type: "add", from: "actor", to: "object", relation: "REJECTED"},
    {type: "add", from: "object", to: "actor", relation: "REJECTED_BY"},
  ],
  remove: [
    {type: "add", from: "actor", to: "object", relation: "CREATED"},
    {type: "add", from: "object", to: "actor", relation: "CREATED_BY"},
  ],
  tentativeAccept: [
    {type: "add", from: "actor", to: "object"},
  ],
  tentativeReject: [
    {type: "add", from: "actor", to: "object"},
  ],
  travel: [
    {type: "add", from: "actor", to: "object"},
  ],
  undo: [
    {type: "add", from: "actor", to: "object"},
  ],
  update: [
    {type: "add", from: "actor", to: "object", relation: "UPDATED"},
    {type: "add", from: "object", to: "actor", relation: "UPDATED_BY"},
  ],
  view: [
    {type: "add", from: "actor", to: "object", relation: "VIEWED"},
    {type: "add", from: "object", to: "actor", relation: "VIEWED_BY"},
  ],
};

export enum NodeType {
  Address           = "address",
  Application       = "application", // computer program
  Assembly          = "assembly",
  Building          = "building",
  Cart              = "cart",
  Category          = "category", // aka Topic, Subject, EventType
  Comment           = "comment",
  Country           = "country",
  Deposit           = "deposit",
  Dish              = "dish",  // aka FoodItem
  District          = "district", // aka SchoolDistrict, HuntingDistrict
  Equipment         = "equipment",
  Event             = "event", // aka Concert, Game, Meal, Listing, Showing, Closing
  Group             = "group", // aka UserGroup, ProductGroup, Department, Team, EventClass
  Idea              = "idea",
  Information       = "information", // (i.e. secret)
  Ingredient        = "ingredient",
  Instruction       = "instruction",
  Inventory         = "inventory",
  Item              = "item", // aka LineItem, OrderItem, CartItem, ListItem
  Language          = "language",
  Level             = "level", // aka Floor (of building)
  List              = "list", // aka TodoList, TaskList
  Locality          = "locality", // aka City, Jurisdiction
  Location          = "location",
  MediaItem         = "mediaItem", // aka File, Photo, Video
  Message           = "message",
  Office            = "office",
  Order             = "order",
  Organization      = "organization",
  Package           = "package",
  Payment           = "payment",
  Permission        = "permission",
  Person            = "person",
  Poll              = "poll",
  Position          = "position", // aka Job, Role
  Post              = "post", // aka Article
  PostalCode        = "postalCode",
  Product           = "product",
  Property          = "property", // aka RealEstate, Land
  Query             = "query", // aka Search, Request
  Receipt           = "receipt",
  Recipe            = "recipe",
  Record            = "record", // aka PatientRecord, MedicalRecord, Document
  Region            = "region", // aka State, Province, HuntingRegion
  Role              = "role",
  Room              = "room",
  Shipment          = "shipment",
  Skill             = "skill",
  Step              = "step",
  Subscription      = "subscription",
  Task              = "task",
  Ticket            = "ticket",
  Unit              = "unit",
  User              = "user",
  Variant           = "variant",
  Venue             = "venue",
  Vote              = "vote",
  Worker            = "worker",
  Workspace         = "workspace", // aka Namespace, Project
}
