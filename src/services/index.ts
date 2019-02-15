/**
 * Wraps Controllers for easy import from other modules
 */
import ActivityController from "./activity/activity.controller";
import AuthenticationController from "./authentication/authentication.controller";
import GoalController from "./flag/goal.controller";
import RelationController from "./graph/relation.controller";
import RoleController from "./user/role.controller";
import SegmentController from "./flag/segment.controller";
import SearchController from "./search/search.controller";
import FlagController from "./flag/flag.controller";
import UserController from "./user/user.controller";

export default [
  ActivityController,
  AuthenticationController,
  GoalController,
  RelationController,
  RoleController,
  SegmentController,
  SearchController,
  FlagController,
  UserController,
];
