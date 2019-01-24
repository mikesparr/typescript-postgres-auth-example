/**
 * Wraps Controllers for easy import from other modules
 */
import AuthenticationController from "./authentication/authentication.controller";
import PermissionController from "./permission/permission.controller";
import RoleController from "./role/role.controller";
import SearchController from "./search/search.controller";
import UserController from "./user/user.controller";

export default [
  AuthenticationController,
  PermissionController,
  RoleController,
  SearchController,
  UserController,
];
