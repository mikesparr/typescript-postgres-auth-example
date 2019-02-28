/**
 * Generate feature flag lists that apply to given users
 * and manage cached values
 */
import jexl from "jexl";
import cache from "../config/cache";
import logger from "../config/logger";

import { Environment } from "../interfaces/environment.interface";

import { event, EventType } from "./activity.helper";

import { getRepository, Repository } from "typeorm";
import { User } from "../services/user/user.entity";
import { Flag } from "../services/flag/flag.entity";
import { Goal } from "../services/flag/goal.entity";
import { Segment } from "../services/flag/segment.entity";

/**
 * Keys for cache
 */
const RESOURCE = "flag";
const FEATURE_FLAGS_KEY = "feature:flags";
const USER_FLAGS_KEY = (userId: string) => `user:${userId}:flags`;

/**
 * Convenience functions for processing user flag lookup
 */
const inArray = (arr: any[], target: any): boolean => {
  if (!arr || !target) {
    return false;
  }

  let itemFound: boolean = false;

  for (const val of arr) {
    if (String(target) === String(val)) {
      itemFound = true;
    }
  }

  return itemFound;
};

const evaluateRules = async (
        rules: Array<{[key: string]: any}>,
        context: {[key: string]: any}): Promise<{[key: string]: any}> => {

  const testResult: {[key: string]: any} = {allTrue: false, anyTrue: false};
  let testResultString: string = "";

  if (rules) {
    const resultList: boolean[] = [];
    for (const rule of rules) {
      if (rule && rule.expression && context) {
        const test: boolean = await jexl.eval(rule.expression, context);
        logger.debug(`Logging ${test} as result for ${rule.expression}`);
        resultList.push(test);
      }
      testResultString = await testResultString + await String(test); // forcing serial
    }

    if (testResultString.length > 0) {
      testResult.allTrue = resultList.every((val) => val === true);
      testResult.anyTrue = resultList.some((val) => val === true);
    }
  }

  return testResult;
};

const evaluateSegments = async (user: User, segments: Segment[]): Promise<boolean> => {
  let userInSegments: boolean = false;
  let testSegmentString: string = "";

  if (segments) {
    for (const segment of segments) {
      if (!inArray(segment.excluded, user.email)) {
        if (inArray(segment.included, user.email)) {
          userInSegments = true;
        } else if (segment.rules) {
          logger.debug(`Rules ${JSON.stringify(segment.rules)}`);
          const testResult: {[key: string]: any} = await evaluateRules(segment.rules, user);
          logger.debug(`Segment ${segment.name} result: ${JSON.stringify(testResult)}`);
          if (testResult.allTrue) {
            userInSegments = true;
          }
        }
      }
      testSegmentString = testSegmentString + segment.key; // forcing serial
    }
  }

  return userInSegments;
};

const getVariantKeyAndGoalIds = (variants: {[key: string]: any}): {[key: string]: any} => {
  if (!variants) {
    return null;
  }

  const variantPool: string[] = [];
  Object.keys(variants).map((key) => {
    const variant: {[key: string]: any} = variants[key];
    for (let i = 0; i < variant.weight; i++) {
      variantPool.push(key);
    }
  });
  const chosenIndex: number = Math.floor(Math.random() * (variantPool.length - 1));
  const chosenVariant: any = variants[variantPool[chosenIndex]];

  return chosenVariant;
};

/**
 * Merges the user-readable `keys` from goal array and variant array
 * @param flagGoals
 * @param variantGoalIds
 */
const getMergedGoalIds = (flagGoals: Goal[], variantGoalIds: any[]): string[] => {
  if (!flagGoals && !variantGoalIds) {
    return [];
  }

  // use object to de-duplicate (Set)
  const mergedIds: {[key: string]: any} = {};

  if (flagGoals) {
    for (const goal of flagGoals) {
      mergedIds[goal.key] = true;
    }
  }
  if (variantGoalIds) {
    for (const goalId of variantGoalIds) {
      mergedIds[goalId] = true;
    }
  }

  return Object.keys(mergedIds);
};

const getFlagsFromDatabase = async (): Promise<Flag[]> => {
  const flagRepository: Repository<Flag> = getRepository(Flag);
  return flagRepository.find({ relations: ["goals", "segments"] });
};

/**
 * Returns list of feature flags that apply to given user
 *
 * @param user
 * @param flags (optional if fetched from db or cache already)
 */
const getFlagsForUser = async (user: User, flags?: Flag[]): Promise<Array<{[key: string]: any}>> => {
  const started: number = Date.now();
  const userFlags: Array<{[key: string]: any}> = [];

  // check if in cache first and return
  const userFlagsFromCache: Array<{[key: string]: any}> = await getUserFlagsFromCache(user);
  if (userFlagsFromCache) {
    log(EventType.CACHE_HIT, USER_FLAGS_KEY(user.id), started);
    return userFlagsFromCache;
  }

  // get flags from database or cache if not provided
  if (!flags) {
    const flagsFromCache: Flag[] = await getFlagsFromCache();
    if (flagsFromCache) {
      flags = flagsFromCache;
      log(EventType.CACHE_HIT, FEATURE_FLAGS_KEY, started);
    }
    // check if flags in cache first
    flags = await getFlagsFromDatabase();

    // save in cache
    await saveFlagsToCache(flags);
    log(EventType.CACHE_MISS, FEATURE_FLAGS_KEY, started);
  }

  if (flags) {
    logger.debug("Looping through flags");
    for (const flag of flags) {
      let addFlag: boolean = false;
      let flagKey: string;

      // check for environment-specific config and override values
      if (!flag.archived) {
        if (flag.environments && flag.environments.hasOwnProperty(process.env.NODE_ENV)) {
          const environmentConfig: Environment = flag.environments[process.env.NODE_ENV];
          if (environmentConfig) {
            logger.debug(`Overriding flag config for environment ${process.env.NODE_ENV}`);
            flag.targetEmails = environmentConfig.targetEmails;
            flag.goals = environmentConfig.goalIds ?
              environmentConfig.goalIds.map((goalId) => ({ key: goalId })) as Goal[] : [];
            flag.segments = environmentConfig.segmentKeys ?
              environmentConfig.segmentKeys.map((key) => ({ key })) as Segment[] : [];
            flag.enabled = environmentConfig.enabled;
          }
        }

        if (flag.enabled) {
          logger.debug(`Flag was enabled so adding flag ${flag.key}`);
          addFlag = true;
        }

        if (flag.targetEmails && inArray(flag.targetEmails, user.email)) {
          logger.debug(`Target email matched so adding flag ${flag.key}`);
          addFlag = true;
        }

        if (flag.segments && flag.segments.length > 0) {
          const userInSegments: boolean = await evaluateSegments(user, flag.segments);
          if (userInSegments) {
            logger.debug(`User was in segment so adding flag ${flag.key}`);
            addFlag = true;
          }
        }
      }

      if (addFlag) {
        const chosenVariant: {[key: string]: any} = await getVariantKeyAndGoalIds(flag.variants);
        logger.debug(`Chosen variant: ${JSON.stringify(chosenVariant)}`);
        flagKey = (chosenVariant && chosenVariant.key) ? chosenVariant.key : flag.key;
        const variantGoalIds: string[] = (chosenVariant && chosenVariant.goalIds) ? chosenVariant.goalIds : [];
        const goalIds: string[] = await getMergedGoalIds(flag.goals, variantGoalIds);
        userFlags.push({key: flagKey, goalIds}); // add to userFlags list
      }
    }
  }

  // add user flags to cache
  await saveUserFlagsToCache(user.id, userFlags);
  log(EventType.CACHE_MISS, USER_FLAGS_KEY(user.id), started);

  return userFlags;
};

/**
 * CACHE OPERATIONS
 */
/**
 * Saves flags list object to cache
 * @param flagList
 */
const saveFlagsToCache = async (flagList: {[key: string]: any}): Promise<boolean> => {
  logger.info(`Saving grant list to cache with key ${FEATURE_FLAGS_KEY}`);
  return await cache.set(FEATURE_FLAGS_KEY, JSON.stringify(flagList)) !== null;
};

/**
 * Returns global flags list object if found
 */
const getFlagsFromCache = async (): Promise<Flag[]> => {
  const flagString = await cache.get(FEATURE_FLAGS_KEY);
  return JSON.parse(flagString);
};

/**
 * Deletes global flags from cache
 */
const removeFlagsFromCache = async (): Promise<boolean> => {
  logger.info(`Removing grant list from cache with key ${FEATURE_FLAGS_KEY}`);
  return await cache.del(FEATURE_FLAGS_KEY) === 1;
};

/**
 * Fetches latest flags from database and updates cache
 */
const refreshFlags = async (): Promise<boolean> => {
  const newFlagsList: Flag[] = await getFlagsFromDatabase();
  return saveFlagsToCache(newFlagsList);
};

/**
 * Saves user flags object to cache
 * @param id - user ID
 * @param userFlags
 */
const saveUserFlagsToCache = async (id: string, userFlags: {[key: string]: any}): Promise<boolean> => {
  logger.info(`Saving grant list to cache with key ${FEATURE_FLAGS_KEY}`);
  return await cache.set(USER_FLAGS_KEY(id), JSON.stringify(userFlags)) !== null;
};

/**
 * Returns user flags list object if found
 * @param id
 */
const getUserFlagsFromCache = async (user: User): Promise<Array<{[key: string]: any}>> => {
  const userFlagString = await cache.get(USER_FLAGS_KEY(user.id));
  return JSON.parse(userFlagString);
};

/**
 * Deletes global flags from cache
 */
const removeUserFlagsFromCache = async (user: User): Promise<boolean> => {
  logger.info(`Removing user flags from cache with key ${USER_FLAGS_KEY(user.id)}`);
  return await cache.del(USER_FLAGS_KEY(user.id)) === 1;
};

/**
 * Fetches latest flags from database and updates cache
 */
const refreshUserFlags = async (user: User): Promise<boolean> => {
  const userFlagsList: Array<{[key: string]: any}> = await getFlagsForUser(user);
  return saveFlagsToCache(userFlagsList);
};

/**
 * Emits event for cache hit/miss tracking
 */
const log = (type: EventType, key: string, started: number) => {
  const ended: number = Date.now();

  event.emit(type, {
    key,
    resource: RESOURCE,
    timestamp: ended,
    took: ended - started,
    type,
  });
};

// TODO: add refreshAllUserFlags and globally force refresh

export {
  inArray,
  evaluateRules,
  evaluateSegments,
  getVariantKeyAndGoalIds,
  getMergedGoalIds,
  getFlagsForUser,
  removeFlagsFromCache,
  refreshFlags,
  removeUserFlagsFromCache,
  refreshUserFlags,
};
