/**
 * Validate parameters application needs/expects declared in ENV or .env
 * call this function when bootstrapping app, but after config/index import
 */
import { cleanEnv, port, str } from "envalid";

function validateEnv() {
  cleanEnv(process.env, {
    JWT_SECRET: str(),
    OPEN_CAGE_DATA_KEY: str(),
    PORT: port(),
    POSTGRES_DB: str(),
    POSTGRES_HOST: str(),
    POSTGRES_PASSWORD: str(),
    POSTGRES_PORT: port(),
    POSTGRES_USER: str(),
    REDIS_URL: str(),
  });
}

export default validateEnv;
