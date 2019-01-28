/**
 * Use within 'connection' block in server to create test data
 */
import logger from "./logger";
import { hashPassword } from "../utils/authentication.helper";
import { Connection } from "typeorm";
import {User} from "../services/user/user.entity";
import {Role} from "../services/role/role.entity";
import {Permission} from "../services/permission/permission.entity";

// truncate entity tables in database
const clearDb = async (connection: Connection) => {
  const entities = connection.entityMetadatas;

  for (const entity of entities) {
    const repository = await connection.getRepository(entity.name);
    await repository.query(`DELETE FROM ${entity.tableName};`);
  }
};

const createTestData = async (connection: Connection) => {
  // clear database first
  // await clearDb(connection);
  // logger.info(`Truncated database tables, now creating test data ...`);

  // search
  const searchPermission = connection.manager.create(Permission, {
    resource: "search",
    action: "read:any",
    attributes: "*"
  });

  // user
  const userUserViewPermission = connection.manager.create(Permission, {
    resource: "user",
    action: "read:any",
    attributes: "*, !age, !password"
  });
  const userUserUpdatePermission = connection.manager.create(Permission, {
    resource: "user",
    action: "update:own",
    attributes: "*"
  });
  const adminUserViewPermission = connection.manager.create(Permission, {
    resource: "user",
    action: "read:any",
    attributes: "*, !password"
  });
  const adminUserCreatePermission = connection.manager.create(Permission, {
    resource: "user",
    action: "create:any",
    attributes: "*"
  });
  const adminUserUpdatePermission = connection.manager.create(Permission, {
    resource: "user",
    action: "update:any",
    attributes: "*"
  });
  const adminUserDeletePermission = connection.manager.create(Permission, {
    resource: "user",
    action: "delete:any",
    attributes: "*"
  });

  // role
  const userRoleViewPermission = connection.manager.create(Permission, {
    resource: "role",
    action: "read:any",
    attributes: "*, !permissions"
  });
  const adminRoleViewPermission = connection.manager.create(Permission, {
    resource: "role",
    action: "read:any",
    attributes: "*"
  });
  const adminRoleCreatePermission = connection.manager.create(Permission, {
    resource: "role",
    action: "create:any",
    attributes: "*"
  });
  const adminRoleUpdatePermission = connection.manager.create(Permission, {
    resource: "role",
    action: "update:any",
    attributes: "*"
  });
  const adminRoleDeletePermission = connection.manager.create(Permission, {
    resource: "role",
    action: "delete:any",
    attributes: "*"
  });

  // permission
  const adminPermissionViewPermission = connection.manager.create(Permission, {
    resource: "permission",
    action: "read:any",
    attributes: "*"
  });
  const adminPermissionCreatePermission = connection.manager.create(Permission, {
    resource: "permission",
    action: "create:any",
    attributes: "*"
  });
  const adminPermissionUpdatePermission = connection.manager.create(Permission, {
    resource: "permission",
    action: "update:any",
    attributes: "*"
  });
  const adminPermissionDeletePermission = connection.manager.create(Permission, {
    resource: "permission",
    action: "delete:any",
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
      searchPermission,
      userUserViewPermission,
      userUserUpdatePermission,
      userRoleViewPermission,
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
      adminRoleViewPermission,
      adminRoleCreatePermission,
      adminRoleUpdatePermission,
      adminRoleDeletePermission,
      adminPermissionViewPermission,
      adminPermissionCreatePermission,
      adminPermissionUpdatePermission,
      adminPermissionDeletePermission,
    ]
  });

  logger.info("Adding 3 test roles to database");
  await connection.manager.save(guestRole);
  await connection.manager.save(userRole);
  await connection.manager.save(adminRole);

  logger.info("Adding 3 test users to database");
  await connection.manager.save(connection.manager.create(User, {
    firstName: "Guest",
    lastName: "User",
    age: 0,
    email: "guest@test.com",
    password: await hashPassword("changeme"),
    roles: [guestRole]
  }));
  await connection.manager.save(connection.manager.create(User, {
    firstName: "Basic",
    lastName: "User",
    age: 20,
    email: "user@test.com",
    password: await hashPassword("changeme"),
    roles: [userRole]
  }));
  await connection.manager.save(connection.manager.create(User, {
    firstName: "Admin",
    lastName: "User",
    age: 30,
    email: "admin@test.com",
    password: await hashPassword("changeme"),
    roles: [userRole, adminRole],
  }));
};

export default createTestData;
