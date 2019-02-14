/**
 * Used in feature flags for standard JSON structure
 */
export default interface Variant {
  key: string;
  name: string;
  weight: number;
  goalIds: string[];
}
