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
 8. Open browser tab to localhost:8080/browser for Postgres Admin
   * click on "Servers" and then "Object > Create > Server"
   * "General > Name" the connection "Test Server"
   * click on "Connection" tab:
     * Host: `postgres` (network exposed by docker-compose)
     * Maintenance database: `auth_example` (or whatever you set in ENV vars)
     * Password: `admin` (or whatever you set in ENV vars)
   * click on "Save"
   * traverse "Servers > Test Server > Databases > auth_example > Schemas > public"
 9. Open another browser tab to localhost:3000/api-docs to explore API
   * work in progress (pending tests and RBAC/ABAC features)

# Contributing
As this is just a research project, I don't plan on maintaining LTS but if any
suggestions on improving the app, please write Issue or PR and I'll consider. Thanks!
