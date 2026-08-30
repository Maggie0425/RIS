# Backend knowledge base

This index helps contributors find backend context without loading every project
document. Read only the pages relevant to the current task. Status terms follow
the definitions in the [project documentation index](../README.md).

## Quick map

| Need | Read |
|---|---|
| System boundary and modules | [`../architecture.md`](../architecture.md) |
| Domain terms | [`glossary.md`](glossary.md) |
| Examination and MWL workflows | [`workflows.md`](workflows.md) |
| Target REST routes | [`../api-design.md`](../api-design.md) |
| Conceptual data model | [`../database-erd.md`](../database-erd.md) |
| Authoritative schema history | [`../../backend/src/main/resources/db/migration/`](../../backend/src/main/resources/db/migration/) |
| Migration process | [`../database-workflow.md`](../database-workflow.md) |
| Backend test strategy | [`testing.md`](testing.md) |
| Run and debug locally | [`local-development.md`](local-development.md) |
| Diagnose common failures | [`troubleshooting.md`](troubleshooting.md) |
| Why major choices were made | [`decisions/README.md`](decisions/README.md) |

## Current implementation boundary

Verify this boundary against source before reporting status.

### Implemented when this page was introduced

- System-status REST endpoint.
- Patient CRUD REST API, validation, normalization, errors, and tests.
- Read-only examination listing with newest-first ordering and optional exact
  status filtering.
- Dashboard summary API and integrated dashboard UI with total and per-status
  counts, refresh/error/empty states, status navigation, and frontend/backend
  tests.
- Patient, examination, schedule, report, user, role, and permission persistence
  foundations.
- Server-side examination lifecycle methods and domain tests.
- Flyway migrations V1–V11 and synthetic seed data.
- Swagger/OpenAPI generation for implemented controllers.

### Target, not yet proved end to end

- Spring Security login, JWT handling, and API permission enforcement.
- Examination creation/details/lifecycle actions, scheduling, worklist,
  reporting, and user-administration APIs.
- DICOM MWL SCP and C-FIND matching.
- Testcontainers-backed database tests, end-to-end workflow tests, and CI.

Update this section in the same pull request that changes one of these boundaries.
Source and tests remain authoritative if this summary becomes stale. Keep it as
an implementation boundary, not a sprint diary.
