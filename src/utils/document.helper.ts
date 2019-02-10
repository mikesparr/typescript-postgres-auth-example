/**
 * Helper functions for interacting with the document DB
 * Abstracted from Dao like auth helpers with cache in case
 * choosing different document storage/search solution
 */
import client from "../config/documents"; // Elasticsearch client library
import { DataType, Formatter } from "./formatter";
import logger from "../config/logger";
import SearchResult from "../interfaces/searchresult.interface";
import RecordNotFoundException from "../exceptions/RecordNotFoundException";
import RecordsNotFoundException from "../exceptions/RecordsNotFoundException";
import { filter } from "bluebird";

const fmt: Formatter = new Formatter();

enum DocType {
  DEFAULT = "_doc",
}

export const getAll = async (
        index: string,
        query: {[key: string]: any},
        params: any = {}): Promise<SearchResult> => {
  try {
    logger.debug(`Searching documents index ${index}`);
    // build search options
    const options: {[key: string]: any} = {
      index,
      ...params,
      type: DocType.DEFAULT,
    };

    // add query object if `q` not provided
    if (!params.hasOwnProperty("q")) {
      options.body = {query};
    }
    logger.debug(`Query options: ${JSON.stringify(options)}`);

    const response = await client.search(options);
    logger.debug(`Received response ${JSON.stringify(response)}`);

    if (response && response.hits && response.hits.total > 0) {
      // TODO: return object with total and data for pagination hints in controller response
      const hits = response.hits.hits;
      const filteredResults: Array<{[key: string]: any}> = [];
      hits.map((hit) => filteredResults.push(hit._source));

      return {
        data: filteredResults,
        length: filteredResults.length,
        total: response.hits.total,
      };
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
