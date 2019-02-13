/**
 * Structures used in graph model
 */
export enum RelationAction {
  ADD = "add",
  REMOVE = "remove",
}

export enum ActivityField {
  ACTOR = "actor",
  OBJECT = "object",
  TARGET = "target",
  ORIGIN = "origin",
  RESULT = "result",
  TOOLING = "tooling",
}

export interface ActivityRelation {
  relation: string;
  from: string;
  to: string;
  type: RelationAction;
  [propName: string]: any;
}
