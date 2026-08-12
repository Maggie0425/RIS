# PostgreSQL initialization

This directory is mounted into `/docker-entrypoint-initdb.d` by `compose.yaml` and is reserved for database-level initialization that must happen before the application starts.

Do not place the RIS application schema or synthetic demonstration records here. Flyway owns both and will store them in:

```text
backend/src/main/resources/db/migration/
```

This directory can remain empty unless a PostgreSQL-level initialization requirement is identified.
