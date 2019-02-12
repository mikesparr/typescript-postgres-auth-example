/**
 * Utilities for bi-direction graph relations
 */

// edges (aka relations and bi-directional relation)                    // POTENTIAL NODES WITH RELATION
export const relationMap: {[key: string]: any} = {
  ACCEPTED: { source: "ACCEPTED", target: "ACCEPTED_BY" },              // node: Offer, Package, Message
  ADDED: { source: "ADDED", target: "ADDED_BY" },                       // node: Person, Group, Role, Cart
  ADMITTED: { source: "ADMITTED", target: "ADMITTED_BY" },              // node: Person, Organization, Event
  APPROVED: { source: "APPROVED", target: "APPROVED_BY" },              // node: Record, Post, Payment
  ASSIGNED: { source: "ASSIGNED", target: "ASSIGNED_BY" },              // node: Task, Person
  ATTENDS: { source: "ATTENDS", target: "ATTENDEES" },                  // node: Event
  AUTHORED: { source: "AUTHORED", target: "AUTHORED_BY" },              // node: Post, Comment, Record, Media
  // TODO: consider factoring to Status and StatusChange nodes
  CANCELLED: { source: "CANCELLED", target: "CANCELLED_BY" },           // node: Event, Reservation, Payment
  CHILD_OF: { source: "CHILD_OF", target: "PARENT_OF" },                // node: Person, Category, Organization, Event
  CONFIRMED: { source: "CONFIRMED", target: "CONFIRMED_BY" },           // node: Message, Shipment, Reservation, Payment
  CONTACT_OF: { source: "CONTACT_OF", target: "HAS_CONTACT" },          // node: Person, Organization, Group
  CONTAINS: { source: "CONTAINS", target: "PART_OF" },                  // node: Shipment, Skill, Recipe, Poll (HAS)
  COPIED: { source: "COPIED", target: "COPIED_BY" },                    // node: Post, Record, Event
  COUNTERED: { source: "COUNTERED", target: "COUNTERED_BY" },           // node: Person, Offer
  DATED: { source: "DATED", target: "DATED" },                          // node: Person
  DELETED: { source: "DELETED", target: "DELETED_BY" },                 // node: Post, Record, Comment
  DELIVERS: { source: "DELIVERS", target: "DELIVERED_BY" },             // node: Message, Record, Package, Media
  DENIED: { source: "DENIED", target: "DENIED_BY" },                    // node: Person, Message, Offer
  DISLIKES: { source: "DISLIKES", target: "DISLIKED_BY" },              // node: Person, Product, Event, Media
  DOWNLOADED: { source: "DOWNLOADED", target: "DOWNLOADED_BY" },        // node: File, Photo, Record
  EDITED: { source: "EDITED", target: "EDITED_BY" },                    // node: Person, Record, Post
  FAVORITED: { source: "FAVORITED", target: "FAVORITED_BY" },           // node: Person, Post, Photo, Comment
  FLAGGED: { source: "FLAGGED", target: "FLAGGED_BY" },                 // node: Person, Post, Photo, Comment
  FOLLOWS: { source: "FOLLOWS", target: "FOLLOWED_BY" },                // node: Person, Event, Post, Category
  FRIENDS: { source: "FRIENDS", target: "FRIENDS" },                    // node: Person, Animal, Machine, Entity
  HIDES: { source: "HIDES", target: "HIDDEN_BY" },                      // node: Person, Post, Photo, Comment
  INSTANCE_OF: { source: "INSTANCE_OF", target: "HAS_INSTANCE" },       // node: Product, MediaItem, Record
  INTERESTED_IN: { source: "INTERESTED_IN", target: "HAS_INTEREST" },   // node: Person, Location, Event, Product
  INVITED: { source: "INVITED", target: "INVITED_BY" },                 // node: Person
  KNOWS: { source: "KNOWS", target: "KNOWN_BY" },                       // node: Person, Information
  LEAD_OF: { source: "LEAD_OF", target: "HAS_LEAD" },                   // node: Person, Organization, Group, Location
  LIKES: { source: "LIKES", target: "LIKED_BY" },                       // node: Person, Post, Photo, Record, Comment
  LOCATED: { source: "LOCATED", target: "LOCATION_OF" },                // node: Location, Organization, Property, Event
  MANAGES: { source: "MANAGES", target: "MANAGED_BY" },                 // node: Person, Product, Property, Event
  MANUFACTURES: { source: "MANUFACTURES", target: "MANUFACTURED_BY"},   // node: Organization, Person, Product
  MARRIED_TO: { source: "MARRIED_TO", target: "MARRIED_TO" },           // node: Person, Idea
  MEMBER_OF: { source: "MEMBER_OF", target: "HAS_MEMBER" },             // node: Organization, Group, Category
  MENTIONS: { source: "MENTIONS", target: "MENTIONED_BY" },             // node: Person, MediaItem, Post, Comment
  OFFERED: { source: "OFFERED", target: "OFFERED_BY" },                 // node: Product, Ticket, Record
  ORDERED: { source: "ORDERED", target: "ORDERED_BY" },                 // node: Product, Ticket, Record
  OWNS: { source: "OWNS", target: "OWNED_BY" },                         // node: Product, Property, Record
  PERFORMED_IN: { source: "PERFORMED_IN", target: "HAD_PERFORMER" },    // node: Event, Media
  PRESENTED: { source: "PRESENTED", target: "PRESENTED_BY" },           // node: Event
  PURCHASED: { source: "PURCHASED", target: "PURCHASED_BY" },           // node: Product, Ticket, Property
  RATED: { source: "RATED", target: "RATED_BY" },                       // node: Event, Photo, Post, Product
  RECEIVED: { source: "RECEIVED", target: "RECEIVED_BY" },              // node: Offer, Package, Record, Message
  RECOMMENDS: { source: "RECOMMENDS", target: "RECOMMENDED_BY" },       // node: Person, Event, Venue, Product
  REGISTERED: { source: "REGISTERED", target: "REGISTERED_BY" },        // node: Product, Event, Pet, Person
  REJECTED: { source: "REJECTED", target: "REJECTED_BY" },              // node: Offer, Package, Record, Message
  REMOVED: { source: "REMOVED", target: "REMOVED_BY" },                 // node: Person, Member, Role, Cart
  RENTS: { source: "RENTS", target: "RENTED_BY" },                      // node: Equipment, Property, Media
  RESERVED: { source: "RESERVED", target: "RESERVED_BY" },              // node: Ticket, Position, Equipment, Property
  RETURNED: { source: "RETURNED", target: "RETURNED_BY" },              // node: Record, Package, Message, Product
  SAVED: { source: "SAVED", target: "SAVED_BY" },                       // node: Post, Record, Message
  SEARCHED_FOR: { source: "SEARCHED_FOR", target: "SEARCHED_BY" },      // node: Query
  SENT: { source: "SENT", target: "SENT_BY" },                          // node: Message, Shipment
  SHARED: { source: "SHARED", target: "SHARED_BY" },                    // node: Post
  SIBLING_OF: { source: "SIBLING_OF", target: "SIBLING_OF" },           // node: Person
  SIGNED: { source: "SIGNED", target: "SIGNED_BY" },                    // node: Record, Agreement
  STARRED: { source: "STARRED", target: "STARRED_BY" },                 // node: Post, Photo, Record
  SUBSCRIBES: { source: "SUBSCRIBES", target: "HAS_SUBSCRIBER" },       // node: Category, Record, Post, Product
  TRANSLATES: { source: "TRANSLATES", target: "TRANSLATION_OF" },       // node: Record, MediaItem
  UPLOADED: { source: "UPLOADED", target: "UPLOADED_BY" },              // node: File, Photo, Record
  USES: { source: "USES", target: "USED_BY" },                          // node: Person, Equipment, Ticket, Language
  VIEWED: { source: "VIEWED", target: "VIEWED_BY" },                    // node: Post, Photo, Record, Message
  VISITS: { source: "VISITS", target: "VISITED_BY" },                   // node: Location, Person
  WORKS_AT: { source: "WORKS_AT", target: "HAS_WORKER" },               // node: Organization, Job, Position
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
