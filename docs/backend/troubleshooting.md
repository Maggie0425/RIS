# Backend troubleshooting

## `Connection to localhost:5432 refused`

Meaning: the application or Spring integration test expected PostgreSQL, but no
database was reachable at the configured address.

Checks:

```bash
docker compose ps postgres
docker compose logs postgres
```

Resolution:

```bash
docker compose up -d postgres
```

Then rerun the affected test. Report focused non-database tests separately from
the blocked application-context test.

## Flyway validation failure

Possible causes:

- an applied migration was edited or renamed;
- two branches introduced the same migration version;
- the database contains a manual schema change.

Do not repair this by rewriting shared migration history. Compare migration
files with `flyway_schema_history`, restore immutable applied migrations, and
create a new migration for the required change.

## Hibernate schema validation failure

Treat Flyway as authoritative. Check that all migrations applied successfully
and that the entity mapping matches the resulting schema. Do not switch
`ddl-auto` to schema creation as a permanent fix.

## Port already in use

Check ports 5432, 8080, 4200, and 5050. Stop the conflicting process or adjust
the corresponding local environment setting. Do not commit machine-specific
port changes without team agreement.

## Swagger is missing an expected route

Generated OpenAPI describes implemented controller behaviour. Confirm the
controller and mappings exist; a route listed only in `docs/api-design.md` may
still be a **Target** contract.
