[![CircleCI](https://circleci.com/gh/mikesparr/typescript-postgres-auth-example.svg?style=svg)](https://circleci.com/gh/mikesparr/typescript-postgres-auth-example)

# Typescript Postgres Auth Example
This project was created more for research purposes, reviewing how various other
apps organize their Node/Express/Typescript repos and trying to pick the best 
parts of each. Also, I wanted to figure out how best to combine Postgres, Redis, 
JWT (or other token solution), and RBAC/ABAC authorization. This will be a "playground" 
of sorts until I am comfortable with some of the tech decisions, but public so I can 
gather input from peers.

# Usage (for testing purposes)
 1. clone the repo
 2. `npm install`
 3. Create a `.env` file in project root
 ```bash
# .env
PORT=3000
JWT_SECRET={YOUR JWT SECRET HERE}
OPEN_CAGE_DATA_KEY={YOUR API KEY HERE}
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=auth_example
REDIS_URL=localhost
 ```
 4. Create a `docker.env` file in project root
 ```bash
# docker.env
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=auth_example
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=admin
 ```
 5. `docker-compose up` (may need to edit the paths or permissions on your computer)
 This will spin up Postgres, PGAdmin, and Redis
 6. Run in development mode
   * `npm run dev`
 7. Load some test data
   * uncomment `// await createTestData(connection);` in `server.ts` and "Save" (once)
   * after, re-comment it and "Save" again (avoid duplicate entries in database)
 8. Open browser tab to [Postgres Admin](http://localhost:8080/browser) for Postgres Admin
   * click on "Servers" and then "Object > Create > Server"
   * "General > Name" the connection "Test Server"
   * click on "Connection" tab:
     * Host: `postgres` (network exposed by docker-compose)
     * Maintenance database: `auth_example` (or whatever you set in ENV vars)
     * Password: `admin` (or whatever you set in ENV vars)
   * click on "Save"
   * traverse "Servers > Test Server > Databases > auth_example > Schemas > public"
 9. Open another browser tab to [Swagger UI Explorer](http://localhost:3000/api-docs) to explore API

# Testing
This app includes automated tests using **Supertest** and **Jest** to test routes, etc.
 * `npm test` or `npm run coverage`
 * NOTE: the Docker database and `createTestData` above must be run before testing
 * SEE: `__tests__` folders in application

# User stories (demonstrated by test data and features)
## Check test data
See the `/config/data.test.ts` file to see how permissions, roles, and users were added to the database 
that fulfill the requirements below. The `/util/{type}.helper.ts` files abstract the specific module implementation 
as much as possible so we could change out solutions in future without modifying the code base.

### Product Owner
 * As a `product owner`, I want an API that supports various authorization levels, so we can support future revenue and feature models

### Guest
 * As a `guest`, I want to be able to `register` or `login`, so that I can access features within the app

### User
 * As a `user`, I want to be able to `search` by city name, so I can view geo data about the city
 * As a `user`, I want to be able to **view** `users` (*without age or password*), so I know users of the system
 * As a `user`, I want to be able to **edit** my own `user` record, so I can keep my information current
 * As a `user`, I want to be able to **view** a list of `roles` (*without permissions*) so I know what roles are available

### Admin
 * As an `admin`, I want to be able to `search` by city name, so I can view geo data about the city
 * As an `admin`, I want to be able to **view** `users` (*with age but no password*), so I know users of the system and their age
 * As an `admin`, I want to be able to **create** any `user` record, so I can manage users in the system
 * As an `admin`, I want to be able to **edit** any `user` record, so I can manage users in the system
 * As an `admin`, I want to be able to **delete** any `user` record, so I can manage users and keep the system current
 * As an `admin`, I want to be able to **view** `roles` (*with permissions*), so I know roles of the system and their permissions
 * As an `admin`, I want to be able to **create** any `role` record, so I can manage roles in the system
 * As an `admin`, I want to be able to **edit** any `role` record, so I can manage roles in the system
 * As an `admin`, I want to be able to **delete** any `role` record, so I can manage roles and keep the system current
 * As an `admin`, I want to be able to **view** `permissions`, so I know permissions of the system and their permissions
 * As an `admin`, I want to be able to **create** any `permission` record, so I can manage permissions in the system
 * As an `admin`, I want to be able to **edit** any `permission` record, so I can manage permissions in the system
 * As an `admin`, I want to be able to **delete** any `permission` record, so I can manage permissions and keep the system current

# TODO
## Add support for group permissions
One could extend the functionality to add **group** or **department** (team) access as well. By making a `user`
a member of a **group** and then adding author or group *ownership* to records, you can extend the Controller logic
to `isOwnerOrMember` to check the records accordingly.

 * Example from AccessControl module author: https://github.com/onury/accesscontrol/issues/39

## Add support for other API views (i.e. GraphQL)
Some of the database interaction via ORM in Controllers could be factored out to a lib/model object for each 
service so the Controller just calls methods. This way if we added a GraphQL service the resolvers could reuse the 
same methods to keep the app DRY.
 * UPDATE 1/27/19: I factored controller logic to DAO layer so they could be reused by GraphQL resolvers
 * Time permitting, I may add GraphQL Schema/Resolvers and interface as well so this is multi-purpose API

# Resources
 * [Methodology: 12-factor](https://12factor.net/)
 * [Language: Typescript](https://www.typescriptlang.org/)
 * [Framework: Express](https://expressjs.com/)
 * [Documentation: Swagger UI](https://swagger.io/docs/open-source-tools/swagger-ui/usage/installation/)
 * [Documentation: OpenAPI](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md)
 * [Config: Dotenv](https://www.npmjs.com/package/dotenv)
 * [Logging: Winston](https://www.npmjs.com/package/winston)
 * [Security: Helmet](https://www.npmjs.com/package/helmet)
 * [Authentication: JWT](https://www.npmjs.com/package/jsonwebtoken)
 * [Authorization: AccessControl](https://www.npmjs.com/package/accesscontrol)
 * [Validation: Class Validator](https://www.npmjs.com/package/class-validator)
 * [Database: TypeORM](https://www.npmjs.com/package/typeorm)
 * [Database: PostgreSQL](https://www.postgresql.org/)
 * [Database: Redis](https://redis.io/commands/)
 * [Testing: Jest](https://jestjs.io/en/)
 * [Testing: Supertest](https://www.npmjs.com/package/supertest)
 * [Testing: Docker Compose](https://docs.docker.com/compose/)
 * [Testing: Postgres Admin](https://www.pgadmin.org/)
 * [Testing: Redis CLI](https://redis.io/topics/rediscli)

# Inspiration / Credits
As I wanted to piece together RBAC/ABAC using popular stack choices, I found several good examples online. I'd 
like to give credit and thanks to the following for their hard work and excellent articles and examples.

 * [Node Best Practices](https://github.com/i0natan/nodebestpractices)
 * [Microsoft Typescript Node Starter](https://github.com/Microsoft/TypeScript-Node-Starter)
 * [Article by Alex Permyakov](https://medium.com/@alex.permyakov/production-ready-node-js-rest-apis-setup-using-typescript-postgresql-and-redis-a9525871407)
 * [Article by Marcin Wanago](https://wanago.io/2019/01/14/express-postgres-relational-databases-typeorm/)
 * [Jest with Typescript](https://blog.morizyun.com/javascript/library-typescript-jest-unit-test.html)

# Contributing
As this is just a research project, I don't plan on maintaining LTS but if any
suggestions on improving the app, please write Issue or PR and I'll consider. Thanks!
