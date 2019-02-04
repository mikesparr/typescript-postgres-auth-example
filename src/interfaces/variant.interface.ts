/**
 * Used in feature flags for standard JSON structure
 */
export default interface IVariant {
  name: string;
  weight: number;
  goalIds: string[];
}
