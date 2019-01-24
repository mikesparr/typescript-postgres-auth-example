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

const DENYLIST_KEY: string = "token:denylist";
const USER_TOKENS_KEY = (userId: number | string): string => `user:${userId}:tokens`;

const hashPassword = async (plainTextPassword: string): Promise<string> => {
  return bcrypt.hash(plainTextPassword, 10);
}

const verifyPassword = async (plainTextPassword: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainTextPassword, hashedPassword);
}

const createToken = async (user: User): Promise<string> => {
  const secret = process.env.JWT_SECRET;
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
  let foundToken = null;

  if (request && request.headers && request.headers.authorization) {
    const parts = request.headers['authorization'].split(' ');
    if (parts.length === 2) {
      const scheme = parts[0];
      const credentials = parts[1];
  
      if (/^Bearer$/i.test(scheme)) {
        foundToken = credentials;
      }
    }
  }

  return foundToken;
}

const readToken = (token: string): User => {
  const secret = process.env.JWT_SECRET;
  return jwt.verify(token, secret) as User;
}

const revokeUserAccess = async (user: User): Promise<void> => {
  await addAllUserTokensToDenyList(user);
  await removeAllUserTokensFromCache(user);
}

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

const getTokenFromCache = async (token: string): Promise<string> => {
  return cache.get(token);
}

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

const addTokenToUserTokensList = async (user: User, token: string): Promise<boolean> => {
  return await cache.sadd(USER_TOKENS_KEY(user.id), token) === 1;
}

const getTokensFromUserTokensList = async (user: User): Promise<string[]> => {
  return cache.smembers(USER_TOKENS_KEY(user.id));
}

const removeTokenFromUserTokensList = async (user: User, token: string): Promise<boolean> => {
  return await cache.srem(USER_TOKENS_KEY(user.id), token) === 1;
}

const addAllUserTokensToDenyList = async (user:User): Promise<void> => {
  const userTokens = await getTokensFromUserTokensList(user);
  userTokens.forEach(async (token) => await addTokenToDenyList(token));
}

const removeAllUserTokensFromCache = async (user:User): Promise<void> => {
  const userTokens = await getTokensFromUserTokensList(user);
  userTokens.forEach(async (token) => await removeTokenFromCache(token));
}

const addTokenToDenyList = async (token: string): Promise<boolean> => {
  return await cache.sadd(DENYLIST_KEY, token) === 1;
}

const isTokenInDenyList = async (token: string): Promise<boolean> => {
  return await cache.sismember(DENYLIST_KEY, token) === 1;
}

const removeTokenFromDenyList = async (token: string): Promise<boolean> => {
  return await cache.srem(DENYLIST_KEY, token) >= 1;
}

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
