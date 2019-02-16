/**
 * Use within 'connection' block in server to create test data
 */
import { Connection } from "typeorm";
import { Permission } from "../services/user/permission.entity";
import { Role } from "../services/user/role.entity";
import { User } from "../services/user/user.entity";
import { Flag, FlagType } from "../services/flag/flag.entity";
import { Goal } from "../services/flag/goal.entity";
import { Segment } from "../services/flag/segment.entity";
import { hashPassword } from "../utils/authentication.helper";
import logger from "../config/logger";
import cache from "../config/cache";

// truncate entity tables in database
const clearDb = async (connection: Connection) => {
  const entities = connection.entityMetadatas;

  for (const entity of entities) {
    const repository = await connection.getRepository(entity.name);
    await repository.query(`DELETE FROM "${entity.tableName}" CASCADE;`);
  }
};

const resetUserPermissionCache = async () => {
  await cache.del("authorization:grants");
};

const isDataAlreadyLoaded = async (connection: Connection) => {
  try {
    const adminUser: User =
            await connection.manager.findOneOrFail(User, { email: "admin@example.com" });

    if (adminUser) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false; // user not found so proceed
  }
};

const loadData = async (connection: Connection) => {
  // clear database first
  // await clearDb(connection);
  // logger.info(`Dropped database tables, now creating test data ...`);

  await resetUserPermissionCache();
  logger.info("Reset user permission cache");

  /**
   * FEATURE FLAGS
   */
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
    goals: [usageGoal],
    key: "user.login",
    name: "Login form for users",
    segments: [ northAmericaSegment ],
    type: FlagType.USER,
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
    goals: [usageGoal],
    key: "greeting.season",
    name: "Seasonal welcome greeting",
    segments: [ northAmericaSegment ],
    type: FlagType.USER,
  });
  await connection.manager.save(seasonGreetingFlag);

  /**
   * PERMISSIONS, ROLES, USERS
   */
  // logout
  const logoutPermission = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "authentication",
  });
  const logoutPermissionWithId: Permission = await connection.manager.save(logoutPermission);

  // search
  const searchPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "search",
  });
  const searchPermissionWithId: Permission = await connection.manager.save(searchPermission);

  // surrogate "login as user"
  const adminSurrogate = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*, !password, !ip, !surrogatePrincipal.ip, !surrogatePrincipal.password",
    resource: "surrogate",
  });
  const adminSurrogateWithId: Permission = await connection.manager.save(adminSurrogate);

  // activities
  const adminActivityViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*, !actor.password, !actor.surrogatePrincipal.password",
    resource: "activity",
  });
  const adminActivityViewPermissionWithId: Permission = await connection.manager.save(adminActivityViewPermission);

  // graph
  const adminRelationViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "relation",
  });
  const adminRelationViewPermissionWithId: Permission = await connection.manager.save(adminRelationViewPermission);

  const adminRelationCreatePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "relation",
  });
  const adminRelationCreatePermissionWithId: Permission = await connection.manager.save(adminRelationCreatePermission);

  const adminRelationDeletePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "relation",
  });
  const adminRelationDeletePermissionWithId: Permission = await connection.manager.save(adminRelationDeletePermission);

  // user
  const userUserViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*, !age, !password",
    resource: "user",
  });
  const userUserViewPermissionWithId: Permission = await connection.manager.save(userUserViewPermission);

  const userUserUpdatePermission = connection.manager.create(Permission, {
    action: "update:own",
    attributes: "*",
    resource: "user",
  });
  const userUserUpdatePermissionWithId: Permission = await connection.manager.save(userUserUpdatePermission);

  const adminUserViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*, !password",
    resource: "user",
  });
  const adminUserViewPermissionWithId: Permission = await connection.manager.save(adminUserViewPermission);

  const adminUserCreatePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "user",
  });
  const adminUserCreatePermissionWithId: Permission = await connection.manager.save(adminUserCreatePermission);

  const adminUserUpdatePermission = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "user",
  });
  const adminUserUpdatePermissionWithId: Permission = await connection.manager.save(adminUserUpdatePermission);

  const adminUserDeletePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "user",
  });
  const adminUserDeletePermissionWithId: Permission = await connection.manager.save(adminUserDeletePermission);

  // user tokens
  const userUserViewTokens = connection.manager.create(Permission, {
    action: "read:own",
    attributes: "*",
    resource: "token",
  });
  const userUserViewTokensWithId: Permission = await connection.manager.save(userUserViewTokens);

  const userUserDeleteTokens = connection.manager.create(Permission, {
    action: "delete:own",
    attributes: "*",
    resource: "token",
  });
  const userUserDeleteTokensWithId: Permission = await connection.manager.save(userUserDeleteTokens);

  const adminUserViewTokens = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "token",
  });
  const adminUserViewTokensWithId: Permission = await connection.manager.save(adminUserViewTokens);

  const adminUserUpdateTokens = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "token",
  });
  const adminUserUpdateTokensWithId: Permission = await connection.manager.save(adminUserUpdateTokens);

  const adminUserDeleteTokens = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "token",
  });
  const adminUserDeleteTokensWithId: Permission = await connection.manager.save(adminUserDeleteTokens);

  // user roles
  const adminUserViewUserRoles = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*, !password",
    resource: "userrole",
  });
  const adminUserViewUserRolesWithId: Permission = await connection.manager.save(adminUserViewUserRoles);

  const adminUserAddUserRole = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*, !password",
    resource: "userrole",
  });
  const adminUserAddUserRoleWithId: Permission = await connection.manager.save(adminUserAddUserRole);

  const adminUserDeleteUserRole = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*, !password",
    resource: "userrole",
  });
  const adminUserDeleteUserRoleWithId: Permission = await connection.manager.save(adminUserDeleteUserRole);

  // role
  const userRoleViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*, !permissions",
    resource: "role",
  });
  const userRoleViewPermissionWithId: Permission = await connection.manager.save(userRoleViewPermission);

  const adminRoleViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "role",
  });
  const adminRoleViewPermissionWithId: Permission = await connection.manager.save(adminRoleViewPermission);

  const adminRoleCreatePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "role",
  });
  const adminRoleCreatePermissionWithId: Permission = await connection.manager.save(adminRoleCreatePermission);

  const adminRoleUpdatePermission = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "role",
  });
  const adminRoleUpdatePermissionWithId: Permission = await connection.manager.save(adminRoleUpdatePermission);

  const adminRoleDeletePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "role",
  });
  const adminRoleDeletePermissionWithId: Permission = await connection.manager.save(adminRoleDeletePermission);

  // role permissions
  const adminRoleViewRolePermissions = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "rolepermission",
  });
  const adminRoleViewRolePermissionsWithId: Permission = await connection.manager.save(adminRoleViewRolePermissions);

  const adminRoleAddRolePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "rolepermission",
  });
  const adminRoleAddRolePermissionWithId: Permission = await connection.manager.save(adminRoleAddRolePermission);

  const adminRoleDeleteRolePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "rolepermission",
  });
  const adminRoleDeleteRolePermissionWithId: Permission = await connection.manager.save(adminRoleDeleteRolePermission);

  // permission
  const adminPermissionViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "permission",
  });
  const adminPermissionViewPermissionWithId: Permission = await connection.manager.save(adminPermissionViewPermission);

  const adminPermissionCreatePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "permission",
  });
  const adminPermissionCreatePermissionWithId: Permission =
      await connection.manager.save(adminPermissionCreatePermission);

  const adminPermissionDeletePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "permission",
  });
  const adminPermissionDeletePermissionWithId: Permission =
      await connection.manager.save(adminPermissionDeletePermission);

  // goal
  const adminGoalViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "goal",
  });
  const adminGoalViewPermissionWithId: Permission = await connection.manager.save(adminGoalViewPermission);

  const adminGoalCreatePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "goal",
  });
  const adminGoalCreatePermissionWithId: Permission = await connection.manager.save(adminGoalCreatePermission);

  const adminGoalUpdatePermission = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "goal",
  });
  const adminGoalUpdatePermissionWithId: Permission = await connection.manager.save(adminGoalUpdatePermission);

  const adminGoalDeletePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "goal",
  });
  const adminGoalDeletePermissionWithId: Permission = await connection.manager.save(adminGoalDeletePermission);

  // segment
  const adminSegmentViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "segment",
  });
  const adminSegmentViewPermissionWithId: Permission = await connection.manager.save(adminSegmentViewPermission);

  const adminSegmentCreatePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "segment",
  });
  const adminSegmentCreatePermissionWithId: Permission = await connection.manager.save(adminSegmentCreatePermission);

  const adminSegmentUpdatePermission = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "segment",
  });
  const adminSegmentUpdatePermissionWithId: Permission = await connection.manager.save(adminSegmentUpdatePermission);

  const adminSegmentDeletePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "segment",
  });
  const adminSegmentDeletePermissionWithId: Permission = await connection.manager.save(adminSegmentDeletePermission);

  // flag
  const userFlagViewPermission = connection.manager.create(Permission, {
    action: "read:own",
    attributes: "key, name, description",
    resource: "flag",
  });
  const userFlagViewPermissionWithId: Permission = await connection.manager.save(userFlagViewPermission);

  const adminFlagViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "flag",
  });
  const adminFlagViewPermissionWithId: Permission = await connection.manager.save(adminFlagViewPermission);

  const adminFlagCreatePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "flag",
  });
  const adminFlagCreatePermissionWithId: Permission = await connection.manager.save(adminFlagCreatePermission);

  const adminFlagUpdatePermission = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "flag",
  });
  const adminFlagUpdatePermissionWithId: Permission = await connection.manager.save(adminFlagUpdatePermission);

  const adminFlagDeletePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "flag",
  });
  const adminFlagDeletePermissionWithId: Permission = await connection.manager.save(adminFlagDeletePermission);

  /**
   * As you add permissions, also add them to this list in case you
   * want a super-user role and grant all permissions (or just inherit)
   */
  const allPermissionList: Permission[] = [
    adminActivityViewPermissionWithId,
    adminFlagCreatePermissionWithId,
    adminFlagDeletePermissionWithId,
    adminFlagUpdatePermissionWithId,
    adminFlagViewPermissionWithId,
    adminGoalCreatePermissionWithId,
    adminGoalDeletePermissionWithId,
    adminGoalUpdatePermissionWithId,
    adminGoalViewPermissionWithId,
    adminPermissionCreatePermissionWithId,
    adminPermissionDeletePermissionWithId,
    adminPermissionViewPermissionWithId,
    adminRelationCreatePermissionWithId,
    adminRelationDeletePermissionWithId,
    adminRelationViewPermissionWithId,
    adminRoleAddRolePermissionWithId,
    adminRoleCreatePermissionWithId,
    adminRoleDeletePermissionWithId,
    adminRoleDeleteRolePermission,
    adminRoleUpdatePermissionWithId,
    adminRoleViewPermissionWithId,
    adminRoleViewRolePermissionsWithId,
    adminSegmentCreatePermissionWithId,
    adminSegmentDeletePermissionWithId,
    adminSegmentUpdatePermissionWithId,
    adminSegmentViewPermissionWithId,
    adminSurrogateWithId,
    adminUserAddUserRoleWithId,
    adminUserCreatePermissionWithId,
    adminUserDeletePermissionWithId,
    adminUserDeleteTokensWithId,
    adminUserDeleteUserRoleWithId,
    adminUserUpdatePermissionWithId,
    adminUserUpdateTokensWithId,
    adminUserViewPermissionWithId,
    adminUserViewTokensWithId,
    adminUserViewUserRolesWithId,
    logoutPermissionWithId,
    searchPermissionWithId,
    userFlagViewPermissionWithId,
    userRoleViewPermissionWithId,
    userUserDeleteTokensWithId,
    userUserUpdatePermissionWithId,
    userUserViewPermissionWithId,
    userUserViewTokensWithId,
  ];

  /**
   * Roles
   */
  const guestRole = connection.manager.create(Role, {
    description: "Unverified user with limited privileges",
    id: "guest",
    permissions: [
      logoutPermission,
    ],
  });
  await connection.manager.save(guestRole);
  const userRole = connection.manager.create(Role, {
    description: "Authenticated user with basic privileges",
    id: "user",
    permissions: [
      logoutPermissionWithId,
      searchPermissionWithId,
      userFlagViewPermissionWithId,
      userRoleViewPermissionWithId,
      userUserDeleteTokensWithId,
      userUserUpdatePermissionWithId,
      userUserViewPermissionWithId,
      userUserViewTokensWithId,
    ],
  });
  const adminRole = connection.manager.create(Role, {
    description: "Administrative user with all privileges",
    id: "admin",
    permissions: [
      adminActivityViewPermissionWithId,
      adminFlagCreatePermissionWithId,
      adminFlagDeletePermissionWithId,
      adminFlagUpdatePermissionWithId,
      adminFlagViewPermissionWithId,
      adminGoalCreatePermissionWithId,
      adminGoalDeletePermissionWithId,
      adminGoalUpdatePermissionWithId,
      adminGoalViewPermissionWithId,
      adminPermissionCreatePermissionWithId,
      adminPermissionDeletePermissionWithId,
      adminPermissionViewPermissionWithId,
      adminRelationCreatePermissionWithId,
      adminRelationDeletePermission,
      adminRelationViewPermissionWithId,
      adminRoleAddRolePermissionWithId,
      adminRoleCreatePermissionWithId,
      adminRoleDeletePermissionWithId,
      adminRoleDeleteRolePermission,
      adminRoleUpdatePermissionWithId,
      adminRoleViewPermissionWithId,
      adminRoleViewRolePermissionsWithId,
      adminSegmentCreatePermissionWithId,
      adminSegmentDeletePermissionWithId,
      adminSegmentUpdatePermission,
      adminSegmentViewPermissionWithId,
      adminSurrogateWithId,
      adminUserAddUserRoleWithId,
      adminUserCreatePermissionWithId,
      adminUserDeletePermissionWithId,
      adminUserDeleteTokensWithId,
      adminUserDeleteUserRoleWithId,
      adminUserUpdatePermissionWithId,
      adminUserUpdateTokensWithId,
      adminUserViewPermissionWithId,
      adminUserViewTokensWithId,
      adminUserViewUserRolesWithId,
    ],
  });
  const sysadminRole = connection.manager.create(Role, {
    description: "Authenticated user with sysadmin privileges",
    id: "sysadmin",
    permissions: [
      logoutPermissionWithId,
      adminUserViewPermissionWithId,
      adminUserUpdatePermissionWithId,
      adminUserViewTokensWithId,
      adminUserUpdateTokensWithId,
      adminUserDeleteTokensWithId,
    ],
  });

  logger.info("Adding 4 test roles to database");
  await connection.manager.save(guestRole);
  await connection.manager.save(userRole);
  await connection.manager.save(adminRole);
  await connection.manager.save(sysadminRole);

  /**
   * Users
   */
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

};

/**
 * Run this once but if data already exists
 * @param connection
 */
const createTestData = async (connection: Connection) => {
  if (!await isDataAlreadyLoaded(connection)) {
    logger.info("Loading data for first time...");
    await loadData(connection);
  } else {
    logger.info("Data already loaded so running tests...");
  }
};

export default createTestData;
