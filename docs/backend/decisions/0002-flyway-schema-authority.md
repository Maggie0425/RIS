# ADR-0002: Use Flyway as the application schema authority

- Status: Accepted
- Date: 2026-08-12
- Decision owners: COMP3888 P33 team

## Context

All teammates and deployment environments need the same reproducible
PostgreSQL schema and synthetic demonstration data. Manual pgAdmin changes and
Hibernate-generated schemas are not reviewable or reliably repeatable.

## Decision

Use ordered Flyway migrations under
`backend/src/main/resources/db/migration/` as the source of truth for
application tables, constraints, indexes, and required synthetic seed data.
Treat applied migrations as immutable and add a new version for every later
change.

## Consequences

- Database changes are versioned and reviewed with the related application
  code.
- Clean databases can be recreated consistently.
- pgAdmin is for inspection and diagnosis, not permanent schema changes.
- Hibernate validates the migrated schema rather than creating it.

## Evidence

- [`../../database-workflow.md`](../../database-workflow.md), migration process
  and tool responsibilities.
- [`../../../backend/src/main/resources/application.properties`](../../../backend/src/main/resources/application.properties),
  Flyway enabled and Hibernate `ddl-auto=validate`.

## Supersedes / superseded by

None.
