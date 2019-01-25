/**
 * Generate authorization models from User, Role, Permission data and
 * provide hooks into authorization module
 */
import { AccessControl } from "accesscontrol";
import cache from "../config/cache"; // Redis commands
import logger from "../config/logger";
import { getRepository, Repository } from "typeorm";
import { User } from "../services/user/user.entity";
import { Role } from "../services/role/role.entity";
import { Permission } from "../services/permission/permission.entity";

/**
 * Keys for cache
 */
const AUTHORIZATION_GRANTS_KEY = "authorization:grants";

/**
 * Builds JSON grant list from database roles and permissions
 */
const createGrantListFromDatabase = async (): Promise<{[key: string]: any}> => {
  logger.info(`Created new grant list from database`);
  const grantList: Array<{[key: string]: any}> = [];
  const roleRepository: Repository<Role> = getRepository(Role);
  const roles: Role[] = await this.roleRepository.find({ relations: ["permissions"] });

  roles.forEach((role: Role) => {
    role.permissions.forEach((permission: Permission) => {
      const permObj: {[key: string]: any} = {
        role,
        resource: permission.resource,
        action: permission.action,
        attributes: permission.attributes,
      }
      grantList.push(permObj);
    });
  });

  logger.info(grantList); // TODO: move to debug
  return grantList;
}

const getRolesForUser = async (user: User): Promise<string[]> => {
  const roles: string[] = [];
  const userRepository: Repository<Role> = getRepository(Role);
  const foundUser: User = await this.userRepository.find(user.id, { relations: ["roles"] });
  foundUser.roles.forEach((role: Role) => roles.push(role.id));

  logger.info(`Returning roles for user id ${user.id}`); // TODO: move to debug
  return roles;
}

/**
 * Saves grant list object to cache
 * @param grantList 
 */
const saveGrantListToCache = async (grantList: {[key: string]: any}): Promise<boolean> => {
  logger.info(`Saving grant list to cache with key ${AUTHORIZATION_GRANTS_KEY}`);
  return await cache.set(AUTHORIZATION_GRANTS_KEY, grantList) !== null;
}

/**
 * Returns global JSON grant list object if found
 */
const getGrantListFromCache = async (): Promise<{[key: string]: any}> => {
  const grantsString = await cache.get(AUTHORIZATION_GRANTS_KEY);
  return JSON.parse(grantsString);
}

/**
 * Deletes global grants list from cache
 */
const removeGrantListFromCache = async (): Promise<boolean> => {
  logger.info(`Removing grant list from cache with key ${AUTHORIZATION_GRANTS_KEY}`);
  return await cache.del(AUTHORIZATION_GRANTS_KEY) === 1;
}

/**
 * Fetches latest role permissions from database and updates cache
 */
const refreshGrants = async (): Promise<boolean> => {
  const newGrantList: {[key: string]: any} = await createGrantListFromDatabase();
  return saveGrantListToCache(newGrantList);
}

/**
 * Checks whether user is authorized
 */
const authorize = async (user: User, action: string, resource: any): Promise<Boolean> => {
  let grantList = await getGrantListFromCache();
  if (!grantList) {
    await refreshGrants();
    grantList = await getGrantListFromCache();
    logger.info("Had to refresh grant list as it wasn't found in cache");
  }

  const ac: AccessControl = new AccessControl(grantList);
  // fetch user roles TODO: add to cache
  // for each role, check if user can perform action

  return true;
}

/**
 * Filters resource attributes based on user role permission policy
 */
const filter = () => {}; // TODO: add filter implementation

export {
  getRolesForUser,
  createGrantListFromDatabase,
  saveGrantListToCache,
  getGrantListFromCache,
  removeGrantListFromCache,
  refreshGrants,
  authorize,
  filter,
};
