/**
 * Used in feature flags for standard JSON structure
 */
export enum RuleType {
  FIELD = "field",
  LOCAL_DATE = "localDate",
  LOCAL_TIME = "localTime",
}

export interface Rule {
  type: RuleType;
  expression: string;
}
