import logger from "./logger";
import { hashPassword } from "../utils/authentication.helper";
import {User} from "../services/user/user.entity";
import {Role} from "../services/role/role.entity";
import {Permission} from "../services/permission/permission.entity";

const createTestData = async (connection: any) => {
  const userSearchPermission = connection.manager.create(Permission, {
    resource: "search",
    action: "read:any",
    attributes: "*"
  });
  const adminUserViewPermission = connection.manager.create(Permission, {
    resource: "users",
    action: "read:any",
    attributes: "*"
  });
  const userUserViewPermission = connection.manager.create(Permission, {
    resource: "users",
    action: "read:any",
    attributes: "*, !age"
  });
  const adminUserCreatePermission = connection.manager.create(Permission, {
    resource: "users",
    action: "create:any",
    attributes: "*"
  });
  const adminUserUpdatePermission = connection.manager.create(Permission, {
    resource: "users",
    action: "update:any",
    attributes: "*"
  });
  const adminUserDeletePermission = connection.manager.create(Permission, {
    resource: "users",
    action: "update:any",
    attributes: "*"
  });

  const guestRole = connection.manager.create(Role, {
    id: "guest",
    description: "Unverified user with limited privileges",
    permissions: [],
  });
  const userRole = connection.manager.create(Role, {
    id: "user",
    description: "Authenticated user with basic privileges",
    permissions: [
      userSearchPermission,
      userUserViewPermission,
    ]
  });
  const adminRole = connection.manager.create(Role, {
    id: "admin",
    description: "Administrative user with all privileges",
    permissions: [
      adminUserViewPermission,
      adminUserCreatePermission,
      adminUserUpdatePermission,
      adminUserDeletePermission,
    ]
  });

  logger.info("Adding 2 test roles to database");
  await connection.manager.save(guestRole);
  await connection.manager.save(userRole);
  await connection.manager.save(adminRole);

  logger.info("Adding 2 test users to database");
  await connection.manager.save(connection.manager.create(User, {
    firstName: "Guest",
    lastName: "User",
    age: 0,
    email: "guest@test.com",
    password: hashPassword("changeme"),
    roles: [guestRole]
  }));
  await connection.manager.save(connection.manager.create(User, {
    firstName: "Basic",
    lastName: "User",
    age: 18,
    email: "user@test.com",
    password: hashPassword("changeme"),
    roles: [userRole]
  }));
  await connection.manager.save(connection.manager.create(User, {
    firstName: "Admin",
    lastName: "User",
    age: 30,
    email: "admin@test.com",
    password: hashPassword("changeme"),
    roles: [userRole, adminRole],
  }));
};

export default createTestData;
