/**
 * Wraps Controllers for easy import from other modules
 */
import AuthenticationController from "./authentication/authentication.controller";
import GoalController from "./goal/goal.controller";
import PermissionController from "./permission/permission.controller";
import RoleController from "./role/role.controller";
import SegmentController from "./segment/segment.controller";
import SearchController from "./search/search.controller";
import ToggleController from "./toggle/toggle.controller";
import UserController from "./user/user.controller";

export default [
  AuthenticationController,
  GoalController,
  PermissionController,
  RoleController,
  SegmentController,
  SearchController,
  ToggleController,
  UserController,
];
