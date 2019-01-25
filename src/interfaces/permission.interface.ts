import { Permission } from "accesscontrol";

/**
 * Permission wrapper for chosen authorization solution (AccessControl)
 */
interface AuthPermission extends Permission {}

export default AuthPermission;
