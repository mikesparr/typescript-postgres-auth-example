import { AccessControl } from "accesscontrol";

/**
 * Authorization wrapper for chosen solution (AccessControl)
 */
interface Authorizer extends AccessControl {
  provider: string;
}

export default Authorizer;
