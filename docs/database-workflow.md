# Database Workflow

Flyway migrations are the source of truth for the application database. Keep schema changes and synthetic seed data in:

```text
backend/src/main/resources/db/migration/
```

## Making a database change

1. Find the latest migration and create the next version:

   ```text
   V3__create_patients.sql
   V4__create_users_and_roles.sql
   ```

2. Write the required SQL in that file.
3. Start or rebuild the application:

   ```bash
   docker compose up -d --build
   ```

4. Check the result:

   ```bash
   docker compose logs backend
   docker compose exec postgres psql -U ris -d ris \
     -c "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;"
   ```

5. Commit the migration with the related application code.

Use the filename format `V<version>__<description>.sql`, with a unique increasing version, two underscores, and a clear `snake_case` description. Never edit or rename an applied migration; create a new version for the next change.

## Tool responsibilities

- **Flyway migrations:** create and alter tables, constraints, indexes, and required synthetic seed data.
- **pgAdmin:** inspect the schema and data, run read-only queries, and diagnose problems.
- **`ris-infra/postgres/init/`:** database-level infrastructure only, not application tables or seed records.

Do not make permanent application schema or seed-data changes manually in pgAdmin. Manual changes are not reproducible on teammates' databases.

