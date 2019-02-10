import {
  getAll,
  save,
} from "../document.helper";
import logger from "../../config/logger";

import { Client } from "elasticsearch";
import SearchResult from "../../interfaces/searchresult.interface";

describe("document helper", () => {
  const TEST_INDEX: string = "test-data";
  const TEST_NUM_RECORDS: number = 20;
  let client: Client;

  const sleep = (milliseconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  };

  beforeAll(async () => {
    client = await new Client({ host: "localhost:9200", log: "debug" });

    // load some test records to test pagination
    const randomFruit: string[] = [
      "apples",
      "oranges",
      "peaches",
      "bananas",
    ];

    const loadRecord = async (i: number) => {
      const randomString: string = randomFruit[Math.floor(Math.random() * 4) + 1];
      const testRecord: any = {
        id: `test-fruit-${i}`,
        name: randomString,
        timestamp: Date.now(),
      };
      return await client.index({
        body: testRecord,
        id: `test-fruit-${i}`,
        index: TEST_INDEX,
        type: "_doc",
      });
    };

    let counter: number = 0;
    for (let i = 0; i < TEST_NUM_RECORDS; i++) {
      const _: any = await loadRecord(i);
      counter ++;
    }
    logger.info(`Loaded ${await counter} test records`);
    await sleep(2500); // allow Elasticsearch time to index records before searching
  });

  afterAll(async () => {
    await client.indices.delete({index: TEST_INDEX});
    await client.close();
  });

  describe("getAll", () => {
    it("returns default 10 records if no params", async () => {
      const query = {match_all: {}};
      const result = await getAll(TEST_INDEX, query);
      expect(result.length).toEqual(10);
    });

    it("returns 15 records if size params", async () => {
      const query = {match_all: {}};
      const params = {size: 15};
      const result = await getAll(TEST_INDEX, query, params);
      expect(result.length).toEqual(15);
    });

    it("returns last 10 records if size params", async () => {
      const query = {match_all: {}};
      const params = {size: 10, from: 10};
      const result = await getAll(TEST_INDEX, query, params);
      expect(result.length).toEqual(10);
    });

    it("returns last 5 records if size params", async () => {
      const query = {match_all: {}};
      const params = {size: 5, from: 15};
      const result = await getAll(TEST_INDEX, query, params);
      expect(result.length).toEqual(5);
    });
  }); // getAll

  describe("save", () => {
    it("saves documents in given index", async () => {
      const testDocId: string = "test-save-1";
      const testDoc: any = {
        id: testDocId,
        name: "test doc",
        timestamp: Date.now(),
      };

      const result = await save(TEST_INDEX, testDoc, testDocId);
      await sleep(1000); // let doc index

      // fetch doc from ES to confirm it was saved
      const confirm = await client.get({
        id: testDocId,
        index: TEST_INDEX,
        type: "_doc",
      });

      expect(confirm._source).toEqual(testDoc);
    });
  }); // save
});
