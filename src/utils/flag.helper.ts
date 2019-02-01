/**
 * Generate feature flag lists that apply to given users
 * and manage cached values
 */
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

const getFlagsForUser = async (user: User): Promise<string[]> => {
  const userFlags: string[] = [];

  const flagRepository: Repository<Flag> = getRepository(Flag);
  const flags: Flag[] = await flagRepository.find({ relations: ["goals", "segments"] });

  flags.forEach((flag: Flag) => {
    // TODO: check if flag applies to user
    userFlags.push(flag.key);
  });

  return userFlags;
};

export {
  getFlagsForUser,
};
