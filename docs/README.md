# Project documentation

## Status labels

- **Implemented:** verified in the current source, migrations, generated
  contracts, or tests.
- **Target:** agreed design or required end state that may not yet be implemented.
- **Proposed:** a convention or change awaiting team approval.
- **TBC:** unresolved with the client, tutor, or team.

Do not treat a **Target**, **Proposed**, or **TBC** statement as implementation
evidence.

## Source authority

When sources conflict, use this order:

1. Executable source code and build configuration for current implementation.
2. Flyway migrations for database schema and seeded application data.
3. Generated OpenAPI plus controller/DTO tests for implemented REST contracts.
4. Automated tests for verified behaviour.
5. Accepted ADRs and dated client decisions for design intent.
6. Planning documents and README summaries.

Documentation should be corrected when it contradicts a more authoritative
source.

## Documentation map

| Topic | Authoritative location |
|---|---|
| Human setup and project entry point | [`../README.md`](../README.md) |
| Original project brief | [`task-desc.md`](task-desc.md) |
| Client-confirmed decisions | [`client-meeting-notes.md`](client-meeting-notes.md) |
| System boundaries and target architecture | [`architecture.md`](architecture.md) |
| Target REST contract | [`api-design.md`](api-design.md) |
| Conceptual data relationships | [`database-erd.md`](database-erd.md) |
| Flyway and database workflow | [`database-workflow.md`](database-workflow.md) |
| RBAC target design | [`rbac-design.md`](rbac-design.md) |
| Git and pull-request workflow | [`development-workflow.md`](development-workflow.md) |
| Backend knowledge index | [`backend/README.md`](backend/README.md) |
| Major architecture decisions | [`backend/decisions/README.md`](backend/decisions/README.md) |

## Documentation rules

- State a durable fact once and link to it elsewhere.
- Label planned behaviour explicitly.
- Keep source-level details in code and migrations.
- Record major durable decisions as ADRs.
- Record client decisions as dated notes with provenance.
- Do not store secrets, personal data, local credentials, or transient runtime
  state in documentation.
