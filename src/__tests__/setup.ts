import "../config";
import rdbms from "../config/rdbms";
import { createConnection, getConnection, Connection } from "typeorm";

import createTestData from "../config/data.test";

beforeAll(async () => {
  const connection: Connection = await createConnection(rdbms);
  await createTestData(connection);
});

afterAll(async () => {
  await getConnection().close();
});
