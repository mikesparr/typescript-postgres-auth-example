/**
 * Utilities for bi-direction graph relations
 */
import { ActivityField, ActivityRelation, RelationAction } from "../interfaces/graph.interface";
import { Activity } from "../interfaces/activitystream.interface";

import { Relation } from "../services/graph/relation.entity";

/**
 * Dynamically maintain graph relations based on Activity Stream
 *
 * Examples:
 *
 * CREATE: [
 *   {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "CREATED"},
 *   {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "CREATED_BY"},
 * ]
 *
 * INVITE: [
 *   {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.TARGET, relation: "INVITED"},
 *   {type: RelationAction.ADD, from: ActivityField.TARGET, to: ActivityField.OBJECT, relation: "INVITED_TO"},
 *   {type: RelationAction.ADD, from: ActivityField.TARGET, to: ActivityField.ACTOR, relation: "INVITED_BY"},
 *   {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.TARGET, relation: "INVITEE"},
 * ]
 *
 */
export const actionToRelationMap: {[key: string]: any} = {
  accept: [
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "ACCEPTED"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "ACCEPTED_BY"},
  ],
  add: [
    {type: RelationAction.ADD, from: ActivityField.TARGET, to: ActivityField.OBJECT, relation: "ITEMS"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.TARGET, relation: "ITEM_OF"},
  ],
  announce: [],
  arrive: [],
  block: [
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "BLOCKED"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "BLOCKED_BY"},
  ],
  create: [
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "CREATED"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "CREATED_BY"},
  ],
  delete: [
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "DELETED"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "DELETED_BY"},
  ],
  dislike: [
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "DISLIKED"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "DISLIKED_BY"},
  ],
  flag: [
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "FLAGGED"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "FLAGGED_BY"},
  ],
  follow: [
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "FOLLOWS"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "FOLLOWED_BY"},
  ],
  ignore: [
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "IGNORED"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "IGNORED_BY"},
  ],
  invite: [
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.TARGET, relation: "INVITED"},
    {type: RelationAction.ADD, from: ActivityField.TARGET, to: ActivityField.OBJECT, relation: "INVITED_TO"},
    {type: RelationAction.ADD, from: ActivityField.TARGET, to: ActivityField.ACTOR, relation: "INVITED_BY"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.TARGET, relation: "INVITEE"},
  ],
  join: [
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "MEMBER_OF"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "HAS_MEMBER"},
  ],
  leave: [
    {type: RelationAction.REMOVE, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "MEMBER_OF"},
    {type: RelationAction.REMOVE, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "HAS_MEMBER"},
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "WAS_MEMBER"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "PAST_MEMBER"},
  ],
  like: [
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "LIKES"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "LIKED_BY"},
  ],
  listen: [],
  move: [],
  offer: [],
  question: [],
  read: [
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "READ"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "READ_BY"},
  ],
  reject: [
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "REJECTED"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "REJECTED_BY"},
  ],
  remove: [
    {type: RelationAction.REMOVE, from: ActivityField.TARGET, to: ActivityField.OBJECT, relation: "ITEMS"},
    {type: RelationAction.REMOVE, from: ActivityField.OBJECT, to: ActivityField.TARGET, relation: "ITEM_OF"},
  ],
  tentativeAccept: [],
  tentativeReject: [],
  travel: [],
  undo: [],
  update: [
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "UPDATED"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "UPDATED_BY"},
  ],
  view: [
    {type: RelationAction.ADD, from: ActivityField.ACTOR, to: ActivityField.OBJECT, relation: "VIEWED"},
    {type: RelationAction.ADD, from: ActivityField.OBJECT, to: ActivityField.ACTOR, relation: "VIEWED_BY"},
  ],
};

export const getEventRelation = (template: ActivityRelation, data: Activity): Relation => {
  return {
    relation: template.relation,
    sourceId: data[template.from].id,
    sourceType: data[template.from].type,
    targetId: data[template.to].id,
    targetType: data[template.to].type,
  };
};
