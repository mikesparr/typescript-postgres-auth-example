import "../config";
import rdbms from "../config/rdbms";
import { createConnection, getConnection, Connection } from "typeorm";

import createTestData from "./data";

beforeAll(async () => {
  let connection: Connection;
  try {
    connection = await createConnection(rdbms);
    if (!connection.isConnected) {
      await connection.connect();
    }
  } catch (e) {
    // no connection created yet, nothing to get
    connection = await createConnection(rdbms);
  }

  try {
    await createTestData(connection);
  } catch (error) {
    // do nothing
  }
});

afterAll(async () => {
  // await getConnection().close();
});
