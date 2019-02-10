/**
 * Wraps Controllers for easy import from other modules
 */
import AuthenticationController from "./authentication/authentication.controller";
import EventController from "./event/event.controller";
import GoalController from "./flag/goal.controller";
import RoleController from "./user/role.controller";
import SegmentController from "./flag/segment.controller";
import SearchController from "./search/search.controller";
import FlagController from "./flag/flag.controller";
import UserController from "./user/user.controller";

export default [
  AuthenticationController,
  EventController,
  GoalController,
  RoleController,
  SegmentController,
  SearchController,
  FlagController,
  UserController,
];
