/**
 * Use within 'connection' block in server to create test data
 */
import { Connection } from "typeorm";
import { Permission } from "../services/permission/permission.entity";
import { Role } from "../services/role/role.entity";
import { User } from "../services/user/user.entity";
import { Goal } from "../services/goal/goal.entity";
import { Segment } from "../services/segment/segment.entity";
import { Flag } from "../services/flag/flag.entity";
import { hashPassword } from "../utils/authentication.helper";
import logger from "./logger";
import cache from "./cache";

// truncate entity tables in database
const clearDb = async (connection: Connection) => {
  const entities = connection.entityMetadatas;

  for (const entity of entities) {
    const repository = await connection.getRepository(entity.name);
    await repository.query(`DROP TABLE IF EXISTS "${entity.tableName}" CASCADE;`);
  }
};

const resetUserPermissionCache = async () => {
  await cache.del("authorization:grants");
};

const createTestData = async (connection: Connection) => {
  // clear database first
  // await clearDb(connection);
  // logger.info(`Dropped database tables, now creating test data ...`);

  await resetUserPermissionCache();
  logger.info("Reset user permission cache");

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

  // surrogate "login as user"
  const adminSurrogate = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*, !password, !surrogatePrincipal.password",
    resource: "surrogate",
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
  const userUserDeleteTokens = connection.manager.create(Permission, {
    action: "delete:own",
    attributes: "*",
    resource: "token",
  });
  const adminUserViewTokens = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "token",
  });
  const adminUserUpdateTokens = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "token",
  });
  const adminUserDeleteTokens = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "token",
  });

  // user roles
  const adminUserViewUserRoles = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*, !password",
    resource: "userrole",
  });
  const adminUserAddUserRole = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*, !password",
    resource: "userrole",
  });
  const adminUserDeleteUserRole = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*, !password",
    resource: "userrole",
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

  // role permissions
  const adminRoleViewRolePermissions = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "rolepermission",
  });
  const adminRoleAddRolePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "rolepermission",
  });
  const adminRoleDeleteRolePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "rolepermission",
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

  // goal
  const adminGoalViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "goal",
  });
  const adminGoalCreatePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "goal",
  });
  const adminGoalUpdatePermission = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "goal",
  });
  const adminGoalDeletePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "goal",
  });

  // segment
  const adminSegmentViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "segment",
  });
  const adminSegmentCreatePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "segment",
  });
  const adminSegmentUpdatePermission = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "segment",
  });
  const adminSegmentDeletePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "segment",
  });

  // flag
  const userFlagViewPermission = connection.manager.create(Permission, {
    action: "read:own",
    attributes: "key, name, description",
    resource: "flag",
  });
  const adminFlagViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "flag",
  });
  const adminFlagCreatePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "flag",
  });
  const adminFlagUpdatePermission = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "flag",
  });
  const adminFlagDeletePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "flag",
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
      userUserDeleteTokens,
      userFlagViewPermission,
    ],
  });
  const adminRole = connection.manager.create(Role, {
    description: "Administrative user with all privileges",
    id: "admin",
    permissions: [
      adminSurrogate,
      adminUserViewPermission,
      adminUserViewTokens,
      adminUserUpdateTokens,
      adminUserDeleteTokens,
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
      adminGoalViewPermission,
      adminGoalCreatePermission,
      adminGoalUpdatePermission,
      adminGoalDeletePermission,
      adminSegmentCreatePermission,
      adminSegmentViewPermission,
      adminSegmentUpdatePermission,
      adminSegmentDeletePermission,
      adminFlagViewPermission,
      adminFlagCreatePermission,
      adminFlagUpdatePermission,
      adminFlagDeletePermission,
      adminUserViewUserRoles,
      adminUserAddUserRole,
      adminUserDeleteUserRole,
      adminRoleViewRolePermissions,
      adminRoleAddRolePermission,
      adminRoleDeleteRolePermission,
    ],
  });
  const sysadminRole = connection.manager.create(Role, {
    description: "Authenticated user with sysadmin privileges",
    id: "sysadmin",
    permissions: [
      logoutPermission,
      adminUserViewPermission,
      adminUserUpdatePermission,
      adminUserViewTokens,
      adminUserUpdateTokens,
      adminUserDeleteTokens,
    ],
  });

  logger.info("Adding 4 test roles to database");
  await connection.manager.save(guestRole);
  await connection.manager.save(userRole);
  await connection.manager.save(adminRole);
  await connection.manager.save(sysadminRole);

  logger.info("Adding 4 test users to database");
  const guestUser: User = connection.manager.create(User, {
    age: 0,
    email: "guest@example.com",
    firstName: "Guest",
    lastName: "User",
    password: await hashPassword("changeme"),
    roles: [guestRole],
  });
  await connection.manager.save(guestUser);

  const userUser: User = connection.manager.create(User, {
    age: 20,
    email: "user@example.com",
    firstName: "Basic",
    lastName: "User",
    password: await hashPassword("changeme"),
    roles: [userRole],
  });
  await connection.manager.save(userUser);

  const adminUser: User = connection.manager.create(User, {
    age: 30,
    avatar: "http://example.com/me/1234567.jpg",
    country: "US",
    email: "admin@example.com",
    firstName: "Admin",
    ip: "FE80:0000:0000:0000:0202:B3FF:FE1E:8329", // IPV6
    language: "en_US",
    lastName: "User",
    password: await hashPassword("changeme"),
    roles: [userRole, adminRole],
    timeZone: "America/Mountain",
  });
  await connection.manager.save(adminUser);

  const sysadminUser: User = connection.manager.create(User, {
    age: 40,
    email: "sysadmin@example.com",
    firstName: "Sysadmin",
    lastName: "User",
    password: await hashPassword("changeme"),
    roles: [userRole, sysadminRole],
  });
  await connection.manager.save(sysadminUser);

  // goal
  const usageGoal = connection.manager.create(Goal, {
    key: "usage-goal",
    name: "Application usage",
  });
  await connection.manager.save(usageGoal);
  const greenButtonGoal = connection.manager.create(Goal, {
    key: "button-goal-green",
    name: "Green button views",
  });
  await connection.manager.save(greenButtonGoal);
  const redButtonGoal = connection.manager.create(Goal, {
    key: "button-goal-red",
    name: "Red button views",
  });
  await connection.manager.save(redButtonGoal);

  // segment
  const rules: any = [
    { type: "field", expression: "country == 'US' || country == 'CA'" },
  ];
  const northAmericaSegment = connection.manager.create(Segment, {
    excluded: [ "guest@example.com", "sysadmin@example.com" ],
    included: [ "user@example.com", "admin@example.com" ],
    key: "north-america-beta-users",
    name: "Users in US and Canada",
    rules,
  });
  await connection.manager.save(northAmericaSegment);

  // flag
  const userLoginFlag = connection.manager.create(Flag, {
    goals: [ usageGoal ],
    key: "user.login",
    name: "Login form for users",
    segments: [ northAmericaSegment ],
    type: "user",
    variants: {
      ["user.login.green"]: {
        goalIds: [ "button-goal-green" ],
        key: "user.login.green",
        name: "Green button",
        weight: 50,
      },
      ["user.login.red"]: {
        goalIds: [ "button-goal-red" ],
        key: "user.login.red",
        name: "Red button",
        weight: 50,
      },
    },
  });
  await connection.manager.save(userLoginFlag);
  const seasonGreetingFlag = connection.manager.create(Flag, {
    goals: [ usageGoal ],
    key: "greeting.season",
    name: "Seasonal welcome greeting",
    segments: [ northAmericaSegment ],
    type: "user",
  });
  await connection.manager.save(seasonGreetingFlag);
};

export default createTestData;
