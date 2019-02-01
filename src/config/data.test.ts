/**
 * Use within 'connection' block in server to create test data
 */
import { Connection } from "typeorm";
import { Permission } from "../services/permission/permission.entity";
import { Role } from "../services/role/role.entity";
import { User } from "../services/user/user.entity";
import { Goal } from "../services/goal/goal.entity";
import { Rule } from "../services/rule/rule.entity";
import { Toggle } from "../services/toggle/toggle.entity";
import { hashPassword } from "../utils/authentication.helper";
import logger from "./logger";

// truncate entity tables in database
const clearDb = async (connection: Connection) => {
  const entities = connection.entityMetadatas;

  for (const entity of entities) {
    const repository = await connection.getRepository(entity.name);
    await repository.query(`DROP TABLE IF EXISTS "${entity.tableName}" CASCADE;`);
  }
};

const createTestData = async (connection: Connection) => {
  // clear database first
  // await clearDb(connection);
  // logger.info(`Dropped database tables, now creating test data ...`);

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

  // rule
  const adminRuleViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "rule",
  });
  const adminRuleCreatePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "rule",
  });
  const adminRuleUpdatePermission = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "rule",
  });
  const adminRuleDeletePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "rule",
  });

  // toggle
  const adminToggleViewPermission = connection.manager.create(Permission, {
    action: "read:any",
    attributes: "*",
    resource: "toggle",
  });
  const adminToggleCreatePermission = connection.manager.create(Permission, {
    action: "create:any",
    attributes: "*",
    resource: "toggle",
  });
  const adminToggleUpdatePermission = connection.manager.create(Permission, {
    action: "update:any",
    attributes: "*",
    resource: "toggle",
  });
  const adminToggleDeletePermission = connection.manager.create(Permission, {
    action: "delete:any",
    attributes: "*",
    resource: "toggle",
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
      adminRuleCreatePermission,
      adminRuleViewPermission,
      adminRuleUpdatePermission,
      adminRuleDeletePermission,
      adminToggleViewPermission,
      adminToggleCreatePermission,
      adminToggleUpdatePermission,
      adminToggleDeletePermission,
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
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "User",
    password: await hashPassword("changeme"),
    roles: [userRole, adminRole],
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

  // rule
  const rules: any = [
    { type: "field", expression: "country == 'US' || country == 'CA'" },
  ];
  const rulesJson: string = JSON.stringify(rules);
  const northAmericaRule = connection.manager.create(Rule, {
    included: undefined,
    key: "north-america-beta-users",
    name: "Users in US and Canada",
  });
  await connection.manager.save(northAmericaRule);

  // toggle
  const userLoginToggle = connection.manager.create(Toggle, {
    goals: [usageGoal],
    key: "user.login",
    name: "Login form for users",
    owner: userUser.id,
    rules: [northAmericaRule],
    type: "user",
  });
  await connection.manager.save(userLoginToggle);
};

export default createTestData;
