/**
 * Generate feature flag lists that apply to given users
 * and manage cached values
 */
import jexl from "jexl";
import cache from "../config/cache"; // Redis commands
import logger from "../config/logger";
import { getRepository, Repository } from "typeorm";
import { User } from "../services/user/user.entity";
import { Flag } from "../services/flag/flag.entity";
import { Goal } from "../services/goal/goal.entity";
import { Segment } from "../services/segment/segment.entity";

/**
 * Keys for cache
 */
const FEATURE_FLAGS_KEY = "feature:flags";
const USER_FLAGS_KEY = (userId: number | string) => `user:${userId}:flags`;

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

/**
 * Returns list of feature flags that apply to given user
 *
 * @param user
 */
const getFlagsForUser = async (user: User, flags?: Flag[]): Promise<Array<{[key: string]: any}>> => {
  const userFlags: Array<{[key: string]: any}> = [];

  // get flags from database if not provided
  if (!flags) {
    const flagRepository: Repository<Flag> = getRepository(Flag);
    flags = await flagRepository.find({ relations: ["goals", "segments"] });
  }

  if (flags) {
    logger.debug("Looping through flags");
    for (const flag of flags) {
      let addFlag: boolean = false;
      let flagKey: string;

      // TODO: filterFlagForEnvironment
      // (if exists, will only include segments, targetEmails, variants for env)

      if (!flag.archived && flag.segments && flag.segments.length > 0) {
        const userInSegments: boolean = await evaluateSegments(user, flag.segments);
        if (userInSegments) {
          addFlag = true;
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

  return userFlags;
};

export {
  inArray,
  evaluateRules,
  evaluateSegments,
  getVariantKeyAndGoalIds,
  getMergedGoalIds,
  getFlagsForUser,
};
