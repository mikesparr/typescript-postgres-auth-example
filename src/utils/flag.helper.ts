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
const doAllRulesPass = async (user: User, rules: Array<{[key: string]: any}>): Promise<boolean> => {
  const testResults: boolean[] = [];

  for (const rule of rules) {
    logger.debug(`Processing rule ${rule.type}`);
    const result: boolean = await jexl.eval(rule.expression, user);
    testResults.push(result);
  }

  const allPass: boolean = testResults.every((val) => val === true);

  logger.debug(`Returning result ${allPass}`);
  return allPass;
};

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
      const test: boolean = await jexl.eval(rule.expression, context);
      resultList.push(test);
      testResultString = await testResultString + await String(test); // forcing serial
    }

    if (testResultString.length > 0) {
      testResult.allTrue = resultList.every((val) => val === true);
      testResult.anyTrue = resultList.some((val) => val === true);
    }
  }

  return testResult;
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
const getFlagsForUser = async (user: User): Promise<Array<{[key: string]: any}>> => {
  const userFlags: Array<{[key: string]: any}> = [];

  const flagRepository: Repository<Flag> = getRepository(Flag);
  const flags: Flag[] = await flagRepository.find({ relations: ["goals", "segments"] });

  // TODO: consider breaking up into multiple functions after all working
  logger.debug("Looping through flags");
  flags.forEach(async (flag: Flag) => {
    // check if flag applies to user
    let addFlag: boolean = false;

    logger.debug(`Checking flag ${flag.name}`);
    if (flag.enabled && !flag.archived) {
      addFlag = true;
    } else if (flag.segments.length > 0) {
      flag.segments.forEach(async (segment: Segment) => {
        logger.debug(`Checking segment ${segment.name}`);
        // check if user.id in excluded; if so - skip record immediately
        if (segment.excluded.indexOf(user.id) === -1) {
          logger.debug(`User ${user.id} is not in excluded`);
          // check if user.id in included; if so - set addFlag = true
          if (user.id in segment.included) {
            logger.debug(`User ${user.id} is in included`);
            addFlag = true;
          } else if (segment.rules && segment.rules.length > 0) {
            // if addFlag still false, loop through rules
            // addFlag = await doAllRulesPass(user, segment.rules);
            addFlag = true;
          } // end if segment has rules
        } // end if user not excluded
      }); // end segments forEach
    } // end if flag has segments

    if (addFlag) {
      let variantGoalIds: any[] = [];
      let flagKey: string = flag.key;

      // if variants, then loop through them
      if (flag.variants && Object.keys(flag.variants).length > 0) {
        logger.debug("Handling variants");
        logger.debug(JSON.stringify(flag.variants));
        // add weights of ids to array and randomly select one in range (weighted round robin)
        const variantPool: string[] = [];
        Object.keys(flag.variants).map((key) => {
          const variant: {[key: string]: any} = flag.variants[key];
          for (let i = 0; i < variant.weight; i++) {
            variantPool.push(key);
          }
        });
        const chosenIndex: number = Math.floor(Math.random() * (variantPool.length - 1));
        const chosenVariant: any = flag.variants[variantPool[chosenIndex]];

        // add goalIds to array along with variant key (override) so user served up variant
        flagKey = variantPool[chosenIndex];
        logger.debug(JSON.stringify({chosenIndex, chosenVariant, flagKey}));
        variantGoalIds = variantGoalIds.concat(chosenVariant.goalIds);
      } // end if variants

      // combine goalIds from flag with those from variants
      let flagGoalIds: string[] = [];
      if (flag.goals.length > 0) {
        flag.goals.forEach((goal) => flagGoalIds.push(goal.key)); // USING key, not int id
      }
      if (variantGoalIds.length > 0) {
        logger.debug(`Adding variantGoalIds: ${JSON.stringify(variantGoalIds)}`);
        flagGoalIds = flagGoalIds.concat(variantGoalIds);
      }

      logger.debug(`Pushing flag ${flag.id} to flags list`);
      userFlags.push({key: flagKey, goalIds: flagGoalIds});
    } // end if addFlag is true
  }); // forEach flag

  return userFlags;
};

export {
  inArray,
  evaluateRules,
  getVariantKeyAndGoalIds,
  getMergedGoalIds,
  getFlagsForUser,
};
