/**
 * Utilities for bi-direction graph relations
 */

/**
 * Dynamically maintain graph relations based on Activity Stream
 *
 * CREATE: [
 *   {type: "add", from: "actor", to: "object", relation: "CREATED"},
 *   {type: "add", from: "object", to: "actor", relation: "CREATED_BY"},
 * ]
 *
 * UPDATE: [
 *   {type: "add", from: "actor", to: "object", relation: "UPDATED"},
 *   {type: "add", from: "object", to: "actor", relation: "UPDATED_BY"},
 * ]
 *
 * DELETE: [
 *   {type: "add", from: "actor", to: "object", relation: "DELETED"},
 *   {type: "add", from: "object", to: "actor", relation: "DELETED_BY"},
 * ]
 *
 * INVITE: [
 *   {type: "add", from: "actor", to: "target", relation: "INVITED"},
 *   {type: "add", from: "target", to: "object", relation: "INVITED_TO"},
 *   {type: "add", from: "target", to: "actor", relation: "INVITED_BY"},
 *   {type: "add", from: "object", to: "target", relation: "INVITEE"},
 * ]
 *
 * ACCEPT: [
 *   {type: "add", from: "actor", to: "object", relation: "ACCEPTED"},
 *   {type: "add", from: "object", to: "actor", relation: "ACCEPTED_BY"}
 * ]
 *
 * REJECT: [
 *   {type: "add", from: "actor", to: "object", relation: "REJECTED"},
 *   {type: "add", from: "object", to: "actor", relation: "REJECTED_BY"}
 * ]
 *
 * JOIN: [
 *   {type: "add", from: "actor", to: "object", relation: "MEMBER_OF"},
 *   {type: "add", from: "object", to: "actor", relation: "HAS_MEMBER"},
 * ]
 *
 * LEAVE: [
 *   {type: "remove", from: "actor", to: "object", relation: "MEMBER_OF"},
 *   {type: "remove", from: "object", to: "actor", relation: "HAS_MEMBER"},
 * ]
 */
export const actionToRelationMap: {[key: string]: any} = {
  ACCEPT: [
    {type: "add", from: "actor", to: "object"},
  ],
  ADD: [
    {type: "add", from: "actor", to: "object"},
  ],
  ANNOUNCE: [
    {type: "add", from: "actor", to: "object"},
  ],
  ARRIVE: [
    {type: "add", from: "actor", to: "object"},
  ],
  BLOCK: [
    {type: "add", from: "actor", to: "object"},
  ],
  CREATE: [
    {type: "add", from: "actor", to: "object"},
  ],
  DELETE: [
    {type: "add", from: "actor", to: "object"},
  ],
  DISLIKE: [
    {type: "add", from: "actor", to: "object"},
  ],
  FLAG: [
    {type: "add", from: "actor", to: "object"},
  ],
  FOLLOW: [
    {type: "add", from: "actor", to: "object"},
  ],
  IGNORE: [
    {type: "add", from: "actor", to: "object"},
  ],
  INVITE: [
    {type: "add", from: "actor", to: "object"},
  ],
  JOIN: [
    {type: "add", from: "actor", to: "object"},
  ],
  LEAVE: [
    {type: "add", from: "actor", to: "object"},
  ],
  LIKE: [
    {type: "add", from: "actor", to: "object"},
  ],
  LISTEN: [
    {type: "add", from: "actor", to: "object"},
  ],
  MOVE: [
    {type: "add", from: "actor", to: "object"},
  ],
  OFFER: [
    {type: "add", from: "actor", to: "object"},
  ],
  QUESTION: [
    {type: "add", from: "actor", to: "object"},
  ],
  READ: [
    {type: "add", from: "actor", to: "object"},
  ],
  REJECT: [
    {type: "add", from: "actor", to: "object"},
  ],
  REMOVE: [
    {type: "add", from: "actor", to: "object"},
  ],
  TENTATIVE_ACCEPT: [
    {type: "add", from: "actor", to: "object"},
  ],
  TENTATIVE_REJECT: [
    {type: "add", from: "actor", to: "object"},
  ],
  TRAVEL: [
    {type: "add", from: "actor", to: "object"},
  ],
  UNDO: [
    {type: "add", from: "actor", to: "object"},
  ],
  UPDATE: [
    {type: "add", from: "actor", to: "object"},
  ],
  VIEW: [
    {type: "add", from: "actor", to: "object"},
  ],
};

export enum NodeType {
  Address = "address",
  Application = "application", // computer program
  Assembly = "assembly",
  Building = "building",
  Cart = "cart",
  Category = "category", // aka Topic, Subject, EventType
  Comment = "comment",
  Country = "country",
  Deposit = "deposit",
  Dish = "dish",  // aka FoodItem
  District = "district", // aka SchoolDistrict, HuntingDistrict
  Equipment = "equipment",
  Event = "event", // aka Concert, Game, Meal, Listing, Showing, Closing
  Group = "group", // aka UserGroup, ProductGroup, Department, Team, EventClass
  Idea = "idea",
  Information = "information", // (i.e. secret)
  Ingredient = "ingredient",
  Instruction = "instruction",
  Inventory = "inventory",
  Item = "item", // aka LineItem, OrderItem, CartItem, ListItem
  Language = "language",
  Level = "level", // aka Floor (of building)
  List = "list", // aka TodoList, TaskList
  Locality = "locality", // aka City, Jurisdiction
  Location = "location",
  MediaItem = "mediaItem", // aka File, Photo, Video
  Message = "message",
  Office = "office",
  Order = "order",
  Organization = "organization",
  Package = "package",
  Payment = "payment",
  Permission = "permission",
  Person = "person",
  Poll = "poll",
  Position = "position", // aka Job, Role
  Post = "post", // aka Article
  PostalCode = "postalCode",
  Product = "product",
  Property = "property", // aka RealEstate, Land
  Query = "query", // aka Search, Request
  Receipt = "receipt",
  Recipe = "recipe",
  Record = "record", // aka PatientRecord, MedicalRecord, Document
  Region = "region", // aka State, Province, HuntingRegion, CompetitionRegion
  Role = "role",
  Room = "room",
  Shipment = "shipment",
  Skill = "skill",
  Step = "step",
  Subscription = "subscription",
  Task = "task",
  Ticket = "ticket",
  Unit = "unit",
  User = "user",
  Variant = "variant",
  Venue = "venue",
  Vote = "vote",
  Worker = "worker",
  Workspace = "workspace", // aka Namespace, Project
}
