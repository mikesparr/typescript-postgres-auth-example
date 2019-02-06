import { Client } from "elasticsearch";
import logger from "./logger";

const options: {[key: string]: any} = {
  host: process.env.ES_HOST || "http://localhost:9200",
  log: process.env.ES_LOG_LEVEL || "debug",
};

logger.info(`Connecting to document database at host: ${options.host}`);
const client  = new Client(options);

export default client;
