import { ConnectionOptions } from "typeorm";

/**
 * Uses env params to configure TypeORM database library
 */
const config: ConnectionOptions = {
  database: process.env.POSTGRES_DB,
  entities: [
    __dirname + "/../**/*.entity{.ts,.js}",
  ],
  host: process.env.POSTGRES_HOST,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.POSTGRES_PORT),
  synchronize: true,
  type: "postgres",
  username: process.env.POSTGRES_USER,
};

export default config;
