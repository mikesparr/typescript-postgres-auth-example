/**
 * Used in feature flags for standard JSON structure
 * optionally filter segments by environment if they exist
 */
export enum EnvironmentType {
  LOCAL = "development",
  DEVELOPMENT = "development",
  TEST = "test",
  STAGING = "staging",
  PERFORMANCE = "performance",
  PRODUCTION = "production",
}

export interface Environment {
  type: EnvironmentType;
  enabled: boolean;
  targetEmails?: string[];
  segmentKeys?: string[];
  goalIds?: string[];
}
