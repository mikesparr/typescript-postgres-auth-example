/**
 * Container for getAll requests to aide in pagination
 */
export default interface SearchResult {
  data: any;
  length: number;
  total: number;
  limit?: number;
  offset?: number;
}
