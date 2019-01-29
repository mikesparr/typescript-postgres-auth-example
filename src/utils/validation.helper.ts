import { plainToClass } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import HttpException from "../exceptions/HttpException";
import { cleanEnv, port, str } from "envalid";

/**
 * Validates data against Dto constraints
 * @param type
 * @param data
 * @param skipMissingProperties
 */
const validateDto = async (type: any, data: any, skipMissingProperties = false): Promise<boolean | HttpException> => {
  const errors: ValidationError[] = await validate(plainToClass(type, data), { skipMissingProperties });

  if (errors.length > 0) {
    const message = errors.map((error: ValidationError) =>
            Object.keys(error.constraints).map((key) => error.constraints[key])).join(", ");
    throw new HttpException(400, message);
  } else {
    return true;
  }
};

/**
 * Checks whether required environment variables are present for application
 */
const validateEnv = () => {
  cleanEnv(process.env, {
    EMAIL_FROM_DEFAULT: str(),
    EMAIL_TO_DEFAULT: str(),
    JWT_SECRET: str(),
    OPEN_CAGE_DATA_KEY: str(),
    PORT: port(),
    POSTGRES_DB: str(),
    POSTGRES_HOST: str(),
    POSTGRES_PASSWORD: str(),
    POSTGRES_PORT: port(),
    POSTGRES_USER: str(),
    REDIS_URL: str(),
    SENDGRID_API_KEY: str(),
  });
};

export {
  validateDto,
  validateEnv,
};
