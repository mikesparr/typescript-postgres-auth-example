import "../config";
import rdbms from "../config/rdbms";
import { createConnection, getConnection, Connection } from "typeorm";

beforeAll(async () => {
  const connection: Connection = await createConnection(rdbms);
});

afterAll(async () => {
  await getConnection().close();
});
