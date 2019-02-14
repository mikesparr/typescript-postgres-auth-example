import "../config";
import rdbms from "../config/rdbms";
import { createConnection, getConnection, Connection } from "typeorm";

import createTestData from "./data";

beforeAll(async () => {
  const connection: Connection = await createConnection(rdbms);
  try {
    await createTestData(connection);
  } catch (error) {
    // do nothing
  }
});

afterAll(async () => {
  await getConnection().close();
});
