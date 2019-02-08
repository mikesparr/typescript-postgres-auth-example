/**
 * Used for filtering and paging results
 */
export default interface URLParams {
  q?: string;
  limit?: number;
  offset?: number;
  from?: string;
  to?: string;
  sort?: string;
}
