import { NextFunction, Response } from "express";
import logger from "../config/logger";
import { parseToken, readToken, isTokenInDenyList } from "../utils/authentication.helper";
import { getRepository } from "typeorm";
import AuthenticationTokenExpiredException from "../exceptions/AuthenticationTokenExpiredException";
import AuthenticationTokenMissingException from "../exceptions/AuthenticationTokenMissingException";
import WrongAuthenticationTokenException from "../exceptions/WrongAuthenticationTokenException";
import RequestWithUser from "../interfaces/request.interface";
import { User } from "../services/user/user.entity";

/**
 * Validates authentication token for route or throws Error
 * @param request
 * @param response
 * @param next
 */
const authenticationMiddleware = async (request: RequestWithUser, response: Response, next: NextFunction) => {
  const token = parseToken(request);
  logger.debug(`Authentication: ${token}`);

  if (token) {
    const userRepository = getRepository(User);

    try {
      // first check if in deny list
      if (! await isTokenInDenyList(token)) {
        const verificationResponse: User = readToken(token);
        const id = verificationResponse.id;
        const user = await userRepository.findOne(id);
        if (user) {
          request.user = user;
          next();
        } else {
          // TODO: consider checking if token in cache, implying expired session (refresh token)
          next(new WrongAuthenticationTokenException());
        }
      } else {
        next(new AuthenticationTokenExpiredException());
      }
    } catch (error) {
      next(new WrongAuthenticationTokenException());
    }
  } else {
    next(new AuthenticationTokenMissingException());
  }
};

export default authenticationMiddleware;
