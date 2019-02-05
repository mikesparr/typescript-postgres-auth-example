/**
 * Wraps Controllers for easy import from other modules
 */
import AuthenticationController from "./authentication/authentication.controller";
import GoalController from "./goal/goal.controller";
import RoleController from "./role/role.controller";
import SegmentController from "./segment/segment.controller";
import SearchController from "./search/search.controller";
import FlagController from "./flag/flag.controller";
import UserController from "./user/user.controller";

export default [
  AuthenticationController,
  GoalController,
  RoleController,
  SegmentController,
  SearchController,
  FlagController,
  UserController,
];
