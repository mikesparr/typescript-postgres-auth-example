import { AccessControl } from "accesscontrol";

/**
 * Authorization wrapper for chosen solution (AccessControl)
 */
export default interface Authorizer extends AccessControl {
  provider: string;
}
