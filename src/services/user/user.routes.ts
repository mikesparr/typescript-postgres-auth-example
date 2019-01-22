import { UserController } from "./user.controller";

export default [{
  action: "all",
  controller: UserController,
  method: "get",
  path: "/users",
}, {
  action: "one",
  controller: UserController,
  method: "get",
  path: "/users/:id",
}, {
  action: "save",
  controller: UserController,
  method: "post",
  path: "/users",
}, {
  action: "remove",
  controller: UserController,
  method: "delete",
  path: "/users/:id",
}];
