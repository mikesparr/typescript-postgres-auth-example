/**
 * Utilities for bi-direction graph relations
 */
import { ActivityType } from "./activity.helper";

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
  [ActivityType.ACCEPT]: [
    {type: "add", from: "actor", to: "object", relation: "ACCEPTED"},
    {type: "add", from: "object", to: "actor", relation: "ACCEPTED_BY"},
  ],
  [ActivityType.ADD]: [
    {type: "add", from: "actor", to: "object", relation: "CREATED"},
    {type: "add", from: "object", to: "actor", relation: "CREATED_BY"},
  ],
  [ActivityType.ANNOUNCE]: [
    {type: "add", from: "actor", to: "object"},
  ],
  [ActivityType.ARRIVE]: [
    {type: "add", from: "actor", to: "object"},
  ],
  [ActivityType.BLOCK]: [
    {type: "add", from: "actor", to: "object"},
  ],
  [ActivityType.CREATE]: [
    {type: "add", from: "actor", to: "object", relation: "CREATED"},
    {type: "add", from: "object", to: "actor", relation: "CREATED_BY"},
  ],
  [ActivityType.DELETE]: [
    {type: "add", from: "actor", to: "object", relation: "DELETED"},
    {type: "add", from: "object", to: "actor", relation: "DELETED_BY"},
  ],
  [ActivityType.DISLIKE]: [
    {type: "add", from: "actor", to: "object", relation: "DISLIKED"},
    {type: "add", from: "object", to: "actor", relation: "DISLIKED_BY"},
  ],
  [ActivityType.FLAG]: [
    {type: "add", from: "actor", to: "object", relation: "FLAGGED"},
    {type: "add", from: "object", to: "actor", relation: "FLAGGED_BY"},
  ],
  [ActivityType.FOLLOW]: [
    {type: "add", from: "actor", to: "object", relation: "FOLLOWS"},
    {type: "add", from: "object", to: "actor", relation: "FOLLOWED_BY"},
  ],
  [ActivityType.IGNORE]: [
    {type: "add", from: "actor", to: "object", relation: "IGNORED"},
    {type: "add", from: "object", to: "actor", relation: "IGNORED_BY"},
  ],
  [ActivityType.INVITE]: [
    {type: "add", from: "actor", to: "target", relation: "INVITED"},
    {type: "add", from: "target", to: "object", relation: "INVITED_TO"},
    {type: "add", from: "target", to: "actor", relation: "INVITED_BY"},
    {type: "add", from: "object", to: "target", relation: "INVITEE"},
  ],
  [ActivityType.JOIN]: [
    {type: "add", from: "actor", to: "object", relation: "MEMBER_OF"},
    {type: "add", from: "object", to: "actor", relation: "HAS_MEMBER"},
  ],
  [ActivityType.LEAVE]: [
    {type: "remove", from: "actor", to: "object", relation: "MEMBER_OF"},
    {type: "remove", from: "object", to: "actor", relation: "HAS_MEMBER"},
    {type: "add", from: "actor", to: "object", relation: "PAST_MEMBER"},
    {type: "add", from: "object", to: "actor", relation: "FORMER_MEMBER"},
  ],
  [ActivityType.LIKE]: [
    {type: "add", from: "actor", to: "object", relation: "LIKES"},
    {type: "add", from: "object", to: "actor", relation: "LIKED_BY"},
  ],
  [ActivityType.LISTEN]: [
    {type: "add", from: "actor", to: "object"},
  ],
  [ActivityType.MOVE]: [
    {type: "add", from: "actor", to: "object"},
  ],
  [ActivityType.OFFER]: [
    {type: "add", from: "actor", to: "object", relation: "OFFERED"},
    {type: "add", from: "object", to: "actor", relation: "OFFERED_BY"},
  ],
  [ActivityType.QUESTION]: [
    {type: "add", from: "actor", to: "object"},
  ],
  [ActivityType.READ]: [
    {type: "add", from: "actor", to: "object", relation: "READ"},
    {type: "add", from: "object", to: "actor", relation: "READ_BY"},
  ],
  [ActivityType.REJECT]: [
    {type: "add", from: "actor", to: "object", relation: "REJECTED"},
    {type: "add", from: "object", to: "actor", relation: "REJECTED_BY"},
  ],
  [ActivityType.REMOVE]: [
    {type: "add", from: "actor", to: "object", relation: "CREATED"},
    {type: "add", from: "object", to: "actor", relation: "CREATED_BY"},
  ],
  [ActivityType.TENTATIVE_ACCEPT]: [
    {type: "add", from: "actor", to: "object"},
  ],
  [ActivityType.TENTATIVE_REJECT]: [
    {type: "add", from: "actor", to: "object"},
  ],
  [ActivityType.TRAVEL]: [
    {type: "add", from: "actor", to: "object"},
  ],
  [ActivityType.UNDO]: [
    {type: "add", from: "actor", to: "object"},
  ],
  [ActivityType.UPDATE]: [
    {type: "add", from: "actor", to: "object", relation: "UPDATED"},
    {type: "add", from: "object", to: "actor", relation: "UPDATED_BY"},
  ],
  [ActivityType.VIEW]: [
    {type: "add", from: "actor", to: "object", relation: "VIEWED"},
    {type: "add", from: "object", to: "actor", relation: "VIEWED_BY"},
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
