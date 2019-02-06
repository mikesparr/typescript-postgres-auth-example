/**
 * Helper functions for interacting with the document DB
 * Abstracted from Dao like auth helpers with cache in case
 * choosing different document storage/search solution
 */
import client from "../config/documents"; // Elasticsearch client library
import { DataType, Formatter } from "./formatter";
import logger from "../config/logger";
import RecordNotFoundException from "../exceptions/RecordNotFoundException";
import RecordsNotFoundException from "../exceptions/RecordsNotFoundException";

const fmt: Formatter = new Formatter();

enum DocType {
  DEFAULT = "_doc",
}

export const getAll = async (
        index: string,
        query: {[key: string]: any},
        params: any = {}): Promise<object | Error> => {
  try {
    logger.debug(`Searching documents index ${index}`);
    // build search options
    const options: {[key: string]: any} = {
      body: {
        query,
      },
      index,
      ...params,
      type: DocType.DEFAULT,
    };

    const response = await client.search(options);
    logger.debug(`Received response ${JSON.stringify(response)}`);

    // TODO: check for error message and/or hit count perhaps
    if (response) {
      const hits = response.hits.hits;
      logger.debug(`Returning hits ${JSON.stringify(hits)}`);
      return hits;
    } else {
      throw new RecordsNotFoundException(index);
    }
  } catch (error) {
    logger.error(error.message);
    throw new RecordsNotFoundException(index);
  }
};

export const save = async (
        doc: {[key: string]: any},
        index: string,
        id?: string ): Promise<void | Error> => {
  try {
    logger.debug(`Saving document in index ${index}`);
    // add published date
    doc._published = fmt.format(Date.now(), DataType.DATE);

    const options: any = {
      body: doc,
      index,
      type: DocType.DEFAULT,
    };

    // use provided id if it exists
    if (id) {
      options.id = id;
    }

    const response = await client.index(options);
  } catch (error) {
    logger.error(error.message);
    throw new Error(`Error saving document to index ${index}`);
  }
};
