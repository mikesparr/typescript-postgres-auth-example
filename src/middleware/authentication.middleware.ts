import { NextFunction, Response } from "express";
import { parseToken, readToken, isTokenInDenyList } from "../utils/authentication.helper";
import { getRepository } from "typeorm";
import AuthenticationTokenExpiredException from "../exceptions/AuthenticationTokenExpiredException";
import AuthenticationTokenMissingException from "../exceptions/AuthenticationTokenMissingException";
import WrongAuthenticationTokenException from "../exceptions/WrongAuthenticationTokenException";
import RequestWithUser from "../interfaces/request.interface";
import { User } from "../services/user/user.entity";

const authenticationMiddleware = async (request: RequestWithUser, response: Response, next: NextFunction) => {
  const token = parseToken(request);

  if (token) {
    const userRepository = getRepository(User);

    try {
      // first check if in deny list
      if (! await isTokenInDenyList(token)) {
        const verificationResponse: User = readToken(token); // TODO: consider allowing expired and issue header
        const id = verificationResponse.id;
        const user = await userRepository.findOne(id);
        if (user) {
          request.user = user;
          next();
        } else {
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
}

export default authenticationMiddleware;
