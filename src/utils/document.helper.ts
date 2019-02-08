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
        params: any = {}): Promise<any | Error> => {
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
    logger.info(`Query options: ${JSON.stringify(options)}`);

    const response = await client.search(options);
    logger.debug(`Received response ${JSON.stringify(response)}`);

    // TODO: check for error message and/or hit count perhaps
    if (response) {
      const hits = response.hits.hits;
      const filteredResults: Array<{[key: string]: any}> = [];
      hits.map((hit) => filteredResults.push(hit._source));

      return filteredResults;
    } else {
      throw new RecordsNotFoundException(index);
    }
  } catch (error) {
    logger.error(error.message);
    throw new RecordsNotFoundException(index);
  }
};

export const save = async (
        index: string,
        doc: {[key: string]: any},
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
