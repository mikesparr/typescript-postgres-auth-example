/**
 * Use within 'connection' block in server to create test data
 */
import { Connection } from "typeorm";
import { Permission } from "../services/permission/permission.entity";
import { Role } from "../services/role/role.entity";
import { User } from "../services/user/user.entity";
import { hashPassword } from "../utils/authentication.helper";
import logger from "./logger";

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

  // logout
  const logoutPermission = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "authentication",
  });

  // search
  const searchPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "search",
  });

  // user
  const userUserViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*, !age, !password",
    resource: "user",
  });
  const userUserUpdatePermission = connection.manager.create(Permission, {
    action: "update:own",
    attributes: "*",
    resource: "user",
  });
  const adminUserViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*, !password",
    resource: "user",
  });
  const adminUserCreatePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "user",
  });
  const adminUserUpdatePermission = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "user",
  });
  const adminUserDeletePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "user",
  });

  // user tokens
  const userUserViewTokens = connection.manager.create(Permission, {
    action: "read:own",
    attributes: "*",
    resource: "token",
  });
  const adminUserViewTokens = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "token",
  });

  // role
  const userRoleViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*, !permissions",
    resource: "role",
  });
  const adminRoleViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "role",
  });
  const adminRoleCreatePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "role",
  });
  const adminRoleUpdatePermission = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "role",
  });
  const adminRoleDeletePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "role",
  });

  // permission
  const adminPermissionViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "permission",
  });
  const adminPermissionCreatePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "permission",
  });
  const adminPermissionUpdatePermission = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "permission",
  });
  const adminPermissionDeletePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "permission",
  });

  const guestRole = connection.manager.create(Role, {
    description: "Unverified user with limited privileges",
    id: "guest",
    permissions: [
      logoutPermission,
    ],
  });
  const userRole = connection.manager.create(Role, {
    description: "Authenticated user with basic privileges",
    id: "user",
    permissions: [
      logoutPermission,
      searchPermission,
      userUserViewPermission,
      userUserUpdatePermission,
      userRoleViewPermission,
      userUserViewTokens,
    ],
  });
  const adminRole = connection.manager.create(Role, {
    description: "Administrative user with all privileges",
    id: "admin",
    permissions: [
      adminUserViewPermission,
      adminUserViewTokens,
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
    ],
  });

  logger.info("Adding 3 test roles to database");
  await connection.manager.save(guestRole);
  await connection.manager.save(userRole);
  await connection.manager.save(adminRole);

  logger.info("Adding 3 test users to database");
  await connection.manager.save(connection.manager.create(User, {
    age: 0,
    email: "guest@example.com",
    firstName: "Guest",
    lastName: "User",
    password: await hashPassword("changeme"),
    roles: [guestRole],
  }));
  await connection.manager.save(connection.manager.create(User, {
    age: 20,
    email: "user@example.com",
    firstName: "Basic",
    lastName: "User",
    password: await hashPassword("changeme"),
    roles: [userRole],
  }));
  await connection.manager.save(connection.manager.create(User, {
    age: 30,
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "User",
    password: await hashPassword("changeme"),
    roles: [userRole, adminRole],
  }));
};

export default createTestData;
