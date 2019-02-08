/**
 * Wraps Controllers for easy import from other modules
 */
import AuthenticationController from "./authentication/authentication.controller";
import EventController from "./event/event.controller";
import GoalController from "./goal/goal.controller";
import RoleController from "./role/role.controller";
import SegmentController from "./segment/segment.controller";
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
