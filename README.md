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
 3. Setup temp environment configs (TEST only)
    * RUN in CLI from project root `./setenv.test.sh`
 4. Make note of generated files and change to your preferences
    * IMPORTANT: when deploying app, don't use the `.env` file, simply set vars in your CI provider or container manager
 5. `docker-compose up` (may need to edit the paths or permissions on your computer)
 This will spin up Postgres, PGAdmin, and Redis
 6. Run tests (will create test data)
    * `npm run test`
 7. Start up app in developer mode (will watch and recompile for changes)
    * `npm run dev`
 8. Open another browser tab to [Swagger UI Explorer](http://localhost:3000/api-docs) to explore API
 9. Open browser tab to [Postgres Admin](http://localhost:8080/browser) for Postgres Admin
    * click on "Servers" and then "Object > Create > Server"
    * "General > Name" the connection "Test Server"
    * click on "Connection" tab:
      * Host: `postgres` (network exposed by docker-compose)
      * Maintenance database: `auth_example` (or whatever you set in ENV vars)
      * Password: `admin` (or whatever you set in ENV vars)
    * click on "Save"
    * traverse "Servers > Test Server > Databases > auth_example > Schemas > public"

# Testing
This app includes automated tests using **Supertest** and **Jest** to test routes, etc.
 * `npm test` or `npm run coverage`
 * NOTE: the Docker database must be running (see Step 5 above)
 * SEE: `__tests__` folders in application for test source code

# Extending
Every DAO method should `emit` an event in an activity stream format as shown. For max flexibility,
like to disable writes and make the architecture CQRS, you can create a new handler in `src/config/events.ts`.

## Adding new services
You can follow along the commit history relating to the issues (closed) and see how, but a general idea is:
 1. add a new folder (i.e. category) in the `src/services/` folder
 2. if CRUD feature with database, copy `src/services/role/*` and find/replace to match new names
 3. edit `src/config/data.test.ts` and add necessary test data and permissions for CRUD
 4. if new providers, add `src/config/{provider}.ts` and make connections from `process.env.{vars here}`
    * be sure to add test vars to `setenv.test.sh`, `src/utils/validation.helper.ts`, `.env`
 5. edit `src/config/openapi.json` and add routes to documentation (if REST implementation)
 6. if non-CRUD feature, add a new `src/config/event.ts` listener and be sure to `emit` within Dao methods
    * this is key to support CQRS-ES architecture and scale to PubSub or message bus in future as needed

# User stories (demonstrated within by test data and features)
## Check test data
See the `/config/data.test.ts` file to see how permissions, roles, and users were added to the database 
that fulfill the requirements below. The `/util/{type}.helper.ts` files abstract the specific module implementation 
as much as possible so we could change out solutions in future without modifying the code base.

### Guest
 * As a `guest`, I want to be able to `register` or `login`, so that I can access features within the app
 * As a `guest`, I want to confirm my valid `email` address, so that I can gain access to the application
 * As a `guest`, I want to be able to submit my `email` credentials, so I can still `login` if my password is lost

### User
 * As a `user`, I want to be able to `search` by city name, so I can view geo data about the city
 * As a `user`, I want to be able to **view** `users` (*without age or password*), so I know users of the system
 * As a `user`, I want to be able to **edit** my own `user` record, so I can keep my information current
 * As a `user`, I want to be able to **view** a list of `roles` (*without permissions*) so I know what roles are available
 * As a `user`, I want to be able to `logout`, so that my authentication session cannot be used by others
 * As a `user`, I want to be informed if attempts to gain access to my account occur, so I can help prevent unauthorized access
 * As a `user`, I want to be able to disable one or more devices (tokens), so I can prevent unauthorized access

### Admin (User + Admin)
 * As an `admin`, I want to be able to `search` by city name, so I can view geo data about the city
 * As an `admin`, I want to be able to **view** `users` (*with age but no password*), so I know users of the system and their age
 * As an `admin`, I want to be able to **create** any `user` record, so I can manage users in the system
 * As an `admin`, I want to be able to **edit** any `user` record, so I can manage users in the system
 * As an `admin`, I want to be able to **delete** any `user` record, so I can manage users and keep the system current
 * As an `admin`, I want to be able to **view** `roles` (*with permissions*), so I know roles of the system and their permissions
 * As an `admin`, I want to be able to **create** any `role` record, so I can manage roles in the system
 * As an `admin`, I want to be able to **edit** any `role` record, so I can manage roles in the system
 * As an `admin`, I want to be able to **delete** any `role` record, so I can manage roles and keep the system current
 * As an `admin`, I want to be able to **view** `roles` for any user, so I know users of the system and their roles
 * As an `admin`, I want to be able to **add** any `role` record to any user, so I can manage users and their roles in the system
 * As an `admin`, I want to be able to **remove** any `role` record from any user, so I can manage users and keep the system current
 * As an `admin`, I want to be able to **view** `permissions` for any role, so I know permissions of the system and their permissions
 * As an `admin`, I want to be able to **add** any `permission` record to any role, so I can manage permissions in the system
 * As an `admin`, I want to be able to **remove** any `permission` record from any role, so I can manage permissions and keep the system current
 * As an `admin`, I want to be able to deny any user or user device token, so I can manage user and device access

### Systems Administrator
 * As a `sysadmin`, I want to be able to automatically check app health, so I can automate scaling and recovery
 * As a `sysadmin`, I want the app to log all events, so that I can optionally add alerts if acceptable thresholds are exceeded
 * As a `sysadmin`, I want to be able to deny protected access to any user or individual token, so I can prevent unauthorized access
 * As a `sysadmin`, I want to be able to disable client features that may have issues, so I can maintain app stability
 * As a `sysadmin`, I want to identify actions a support user performs on behalf of users, so I can audit and explain data

### Customer Support (Tier 1)
 * As a `support user`, I want to be able to initiate a lost password request for a user, so I can take care of them in real time
 * As a `support user`, I want to be able to assume a users identity without password, so I can use the app as they would and help identify issues
 * As a `support user`, I want to be able to search for and view all users, so I can take care of them in real time
 * As a `support user`, I want to be able to edit a limited set of user data, so I can take care of them in real time

### Technical Support (Tier 1 + Tier 2)
 * As a `tech support`, I want to view and filter user activity logs in real time, so I can troubleshoot issues before escalation
 * As a `tech support`, I want to be able to edit a limited set of user data, so I can test different configurations during troubleshooting

### Product Owner
 * As a `product owner`, I want an API that supports various authorization levels, so we can support future revenue and feature models
 * As a `product owner`, I want all features of the app automatically tested using TDD, so we can keep customers happy with stability
 * As a `product owner`, I want to allow external authentication providers (IdP), so we can offload effort or meet compliance guidelines
 * As a `product owner`, I want to test new features on a subset of users or geographies, so we can measure impact, refine, or revert as needed
 * As a `product owner`, I want to be able to track usage of toggle/flag features, so we can fine-tune before global deployment (or omit)
 * As a `product owner`, I want to ignore metrics performed by support users on behalf of users, so we can accurately measure metrics

### Architect
 * As an `architect`, I want to centralize events/activity stream, so that I can easily add stream pipeline, queue, or bus to implment CQRS-ES
 * As an `architect`, I want the app to be 'stateless' with remote DB, so that I can easily scale to meet growth requirements
 * As an `architect`, I want the app to be layered, so it's extensible with minimal duplicate code and able to change providers
 * As an `architect`, I want to app to be able to run in containers, so it is isolated and can easily scale to meet growth requirements
 * As an `architect`, I want to be able to change password hash solutions, so we can stay current as security standards evolve
 * As an `architect`, I want to be able to plug in security middleware, so we can stay current as security standards evolve

### Developer
 * As a `developer`, I want to be able to toggle/flag new functionality, so we can safely build/deploy and test out new features

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
