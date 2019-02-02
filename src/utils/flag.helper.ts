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
const getFlagsForUser = async (user: User): Promise<string[]> => {
  const userFlags: string[] = [];

  const flagRepository: Repository<Flag> = getRepository(Flag);
  const flags: Flag[] = await flagRepository.find({ relations: ["goals", "segments"] });

  flags.forEach((flag: Flag) => {
    // check if flag applies to user
    const addFlag: boolean = false; // TODO: change to let once editing

    // loop through segments
      // check if user.id in excluded; if so - skip record immediately
      // check if user.id in included; if so - set addFlag = true
      // if addFlag still false, loop through rules
        // if all conditions are true - set addFlag = true

    if (addFlag) {
      // if variants, then loop through them
      // add weights of ids to array and randomly select one in range (weighted round robin)
      // add goalIds to array along with variant key (override) so user served up variant
      userFlags.push(flag.key);
    }
  });

  return userFlags;
};

export {
  getFlagsForUser,
};
