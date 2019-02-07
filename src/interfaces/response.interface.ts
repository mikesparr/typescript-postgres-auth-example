/**
 * Standard API response object
 */
export interface ApiResponse {
  data?: any;
  meta?: {[key: string]: any};
  errors?: Error[];
  message?: string;
}
