import { AccessControl } from "accesscontrol";

/**
 * Authorization wrapper for chosen solution (AccessControl)
 */
interface Authorizer extends AccessControl {}

export default Authorizer;
