/**
 * Centralize authentication functions to allow changing technology
 * as needed with minimal rework (e.g. JOSE to Paseto or bcrypt to argon2)
 */
import bcrypt from "bcrypt";
import cache from "../config/cache"; // Redis commands
import jwt from "jsonwebtoken";
import logger from "../config/logger";
import RequestWithUser from "../interfaces/request.interface";
import { User } from "../services/user/user.entity";

/**
 * Keys for cache
 */
const DENYLIST_KEY: string = "token:denylist";
const USER_TOKENS_KEY = (userId: number | string): string => `user:${userId}:tokens`;

/**
 * Returns hashed password string using preferred crypto
 * @param plainTextPassword 
 */
const hashPassword = async (plainTextPassword: string): Promise<string> => {
  return bcrypt.hash(plainTextPassword, 10);
}

/**
 * Returns true if hashed version of plain text matches hashed version
 * @param plainTextPassword 
 * @param hashedPassword 
 */
const verifyPassword = async (plainTextPassword: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainTextPassword, hashedPassword);
}

/**
 * Creates auth token and stores in cache
 * @param user 
 */
const createToken = async (user: User): Promise<string> => {
  const secret: string = process.env.JWT_SECRET;
  const dataStoredInToken: {[key: string]: any} = {
    id: user.id,
    displayName: `${user.firstName} ${user.lastName}`,
    email: user.email,
  };

  const token: string = jwt.sign(dataStoredInToken, secret, { expiresIn: "1h" });
  await storeTokenInCache(token);
  await addTokenToUserTokensList(user, token);

  return token;
}

/**
 * Extracts token from wherever we expect (header)
 * @param request 
 */
const parseToken = (request: RequestWithUser): string => {
  let foundToken: string = null;

  if (request && request.headers && request.headers.authorization) {
    const parts = request.headers['authorization'].split(' ');
    if (parts.length === 2) {
      const scheme: string = parts[0];
      const credentials: string = parts[1];
  
      if (/^Bearer$/i.test(scheme)) {
        foundToken = credentials;
      }
    }
  }

  return foundToken;
}

/**
 * Returns payload of token after decrypting
 * @param token 
 */
const readToken = (token: string): User => {
  const secret: string = process.env.JWT_SECRET;
  return jwt.verify(token, secret) as User;
}

/**
 * Adds user tokens to deny list and removes from cache
 * @param user 
 */
const revokeUserAccess = async (user: User): Promise<void> => {
  await addAllUserTokensToDenyList(user);
  await removeAllUserTokensFromCache(user);
}

/**
 * Saves token in cache using itself as key
 * @param token 
 */
const storeTokenInCache = async (token: string): Promise<boolean> => {
  const tokenData: User = readToken(token);
  let success: boolean = false;
  
  try {
    cache.set(token, tokenData);
    success = true;
  } catch (error) {
    logger.error(error);
  }
  
  return success;
}

/**
 * Retrieves token payload from cache using itself as key
 * @param token 
 */
const getTokenFromCache = async (token: string): Promise<string> => {
  return cache.get(token);
}

/**
 * Removes token from cache (if that wasn't obvious)
 * @param token 
 */
const removeTokenFromCache = async (token: string): Promise<boolean> => {
  let success: boolean = false;
  
  try {
    cache.del(token);
    success = true;
  } catch (error) {
    logger.error(error);
  }
  
  return success;
}

/**
 * Adds token to list for a given user ID
 * @param user 
 * @param token 
 */
const addTokenToUserTokensList = async (user: User, token: string): Promise<boolean> => {
  return await cache.sadd(USER_TOKENS_KEY(user.id), token) === 1;
}

/**
 * Returns array of token strings for a given user ID
 * @param user 
 */
const getTokensFromUserTokensList = async (user: User): Promise<string[]> => {
  return cache.smembers(USER_TOKENS_KEY(user.id));
}

/**
 * Removes a specified token from a given user's token list
 * @param user 
 * @param token 
 */
const removeTokenFromUserTokensList = async (user: User, token: string): Promise<boolean> => {
  return await cache.srem(USER_TOKENS_KEY(user.id), token) === 1;
}

/**
 * Iterates through user token list and adds all to deny list
 * @param user 
 */
const addAllUserTokensToDenyList = async (user:User): Promise<void> => {
  const userTokens = await getTokensFromUserTokensList(user);
  userTokens.forEach(async (token) => await addTokenToDenyList(token));
}

/**
 * Iterates through user token list and removes from cache
 * @param user 
 */
const removeAllUserTokensFromCache = async (user:User): Promise<void> => {
  const userTokens = await getTokensFromUserTokensList(user);
  userTokens.forEach(async (token) => await removeTokenFromCache(token));
}

/**
 * Adds a given token to global deny list
 * @param token 
 */
const addTokenToDenyList = async (token: string): Promise<boolean> => {
  return await cache.sadd(DENYLIST_KEY, token) === 1;
}

/**
 * Checks whether token is in global deny list
 * @param token 
 */
const isTokenInDenyList = async (token: string): Promise<boolean> => {
  return await cache.sismember(DENYLIST_KEY, token) === 1;
}

/**
 * Removes token from global deny list
 * @param token 
 */
const removeTokenFromDenyList = async (token: string): Promise<boolean> => {
  return await cache.srem(DENYLIST_KEY, token) >= 1;
}

/**
 * Deletes global deny list (allowing all valid tokens)
 */
const resetDenyList = async (): Promise<boolean> => {
  return await cache.del(DENYLIST_KEY) === 1;
}

// TODO: consider device-level grants (store user agent instead of payload)
export {
  hashPassword,
  verifyPassword,
  createToken,
  revokeUserAccess,
  parseToken,
  readToken,
  storeTokenInCache,
  getTokenFromCache,
  removeTokenFromCache,
  addTokenToUserTokensList,
  getTokensFromUserTokensList,
  removeTokenFromUserTokensList,
  addAllUserTokensToDenyList,
  removeAllUserTokensFromCache,
  addTokenToDenyList,
  isTokenInDenyList,
  removeTokenFromDenyList,
  resetDenyList,
}
