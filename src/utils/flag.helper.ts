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
 * Returns list of feature flags that apply to given user
 * TODO: potentially return {key, goalIds: []} instead of just the key strings
 * @param user
 */
const getFlagsForUser = async (user: User): Promise<Array<{[key: string]: any}>> => {
  const userFlags: Array<{[key: string]: any}> = [];

  const flagRepository: Repository<Flag> = getRepository(Flag);
  const flags: Flag[] = await flagRepository.find({ relations: ["goals", "segments"] });

  // TODO: consider breaking up into multiple functions after all working
  logger.info("Looping through flags");
  flags.forEach((flag: Flag) => {
    // check if flag applies to user
    let addFlag: boolean = false;

    logger.info(`Checking flag ${flag.name}`);
    if (flag.enabled && !flag.archived) {
      addFlag = true;
    } else if (flag.segments.length > 0) {
      flag.segments.forEach((segment: Segment) => {
        logger.info(`Checking segment ${segment.name}`);
        // check if user.id in excluded; if so - skip record immediately
        if (segment.excluded.indexOf(user.id) === -1) {
          logger.info(`User ${user.id} is not in excluded`);
          // check if user.id in included; if so - set addFlag = true
          if (user.id in segment.included) {
            logger.info(`User ${user.id} is in included`);
            addFlag = true;
          } else if (segment.rules && segment.rules.length > 0) {
            // if addFlag still false, loop through rules
            const testResults: boolean[] = [];
            // TODO: factor and make sure serial
            segment.rules.forEach(async (rule: {[key: string]: any}) => {
              // TODO: handle non-field types (i.e. localDate | localTime)
              testResults.push( await jexl.eval(rule.expression, user) );
              logger.info("Processed rule"); // TODO: change to debug
            });

            // if all conditions are true - set addFlag = true
            logger.info("Checking if all rule conditions are met"); // TODO: change to debug
            if ( testResults.every((val) => val === true) ) {
              addFlag = true;
            }
          } // end if segment has rules
        } // end if user not excluded
      }); // end segments forEach
    } // end if flag has segments

    if (addFlag) {
      let variantGoalIds: any[] = [];
      let flagKey: string = flag.key;

      // if variants, then loop through them
      if (flag.variants && Object.keys(flag.variants).length > 0) {
        logger.info("Handling variants");
        logger.info(JSON.stringify(flag.variants));
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
        logger.info(JSON.stringify({chosenIndex, chosenVariant, flagKey}));
        variantGoalIds = variantGoalIds.concat(chosenVariant.goalIds);
      } // end if variants

      // combine goalIds from flag with those from variants
      let flagGoalIds: string[] = [];
      if (flag.goals.length > 0) {
        flag.goals.forEach((goal) => flagGoalIds.push(goal.key)); // USING key, not int id
      }
      if (variantGoalIds.length > 0) {
        logger.info(`Adding variantGoalIds: ${JSON.stringify(variantGoalIds)}`);
        flagGoalIds = flagGoalIds.concat(variantGoalIds);
      }

      logger.info(`Pushing flag ${flag.id} to flags list`);
      userFlags.push({key: flagKey, goalIds: flagGoalIds});
    } // end if addFlag is true
  }); // forEach flag

  return userFlags;
};

export {
  getFlagsForUser,
};