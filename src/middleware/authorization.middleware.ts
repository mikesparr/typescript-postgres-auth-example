import { NextFunction, Response } from "express";
import { authorize, filter } from "../utils/authorization.helper";
import { getRepository } from "typeorm";
import AuthenticationTokenExpiredException from "../exceptions/AuthenticationTokenExpiredException";
import RequestWithUser from "../interfaces/request.interface";
import { User } from "../services/user/user.entity";

/**
 * Validates user is authorized to perform action on resource
 * IMPORTANT: include AFTER authenticationMiddleware so user injected into Request
 * @param request 
 * @param response 
 * @param next 
 */
const authorizationMiddleware = async (request: RequestWithUser, response: Response, next: NextFunction) => {
  const user: User = request.user;
}

export default authorizationMiddleware;
