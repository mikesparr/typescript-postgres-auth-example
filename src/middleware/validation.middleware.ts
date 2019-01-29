import { RequestHandler } from "express";
import { validateDto } from "../utils/validation.helper";

/**
 * Validates data against Dto constraints
 * @param type
 * @param skipMissingProperties
 */
const validationMiddleware = (type: any, skipMissingProperties = false): RequestHandler => {
  return async (req, res, next) => {
    try {
      await validateDto(type, req.body, skipMissingProperties);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validationMiddleware;
