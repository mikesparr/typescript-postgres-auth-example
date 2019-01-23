import { NextFunction, Response } from "express";
import * as jwt from "jsonwebtoken";
import { getRepository } from "typeorm";
import AuthenticationTokenMissingException from "../exceptions/AuthenticationTokenMissingException";
import WrongAuthenticationTokenException from "../exceptions/WrongAuthenticationTokenException";
import RequestWithUser from "../interfaces/request.interface";
import { User } from "../services/user/user.entity";

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

const authenticationMiddleware = async (request: RequestWithUser, response: Response, next: NextFunction) => {
  const token = parseToken(request);

  if (token) {
    const secret = process.env.JWT_SECRET;
    const userRepository = getRepository(User);

    // TODO: add cert signing for more security
    // TODO: consider adding JWT blacklist check in cache (Redis) to avoid hijacking

    try {
      const verificationResponse = jwt.verify(token, secret) as User;
      const id = verificationResponse.id; // TODO: consider using sub key as standard for 'subject'
      const user = await userRepository.findOne(id); // TODO: consider grabbing from cache (Redis)
      if (user) {
        request.user = user;
        next();
      } else {
        next(new WrongAuthenticationTokenException());
      }
    } catch (error) {
      next(new WrongAuthenticationTokenException());
    }
  } else {
    next(new AuthenticationTokenMissingException());
  }
}

export default authenticationMiddleware;
