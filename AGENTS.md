# Codex Working Context

Before making significant changes, read:

- `README.md` for the current project overview, scope, and confirmed stack.
- `task-desc.md` for the original project requirements.
- `docs/architecture.md` for domain rules and system boundaries that may not be obvious from the code.

Treat source code, build files, database migrations, and deployment configuration as the source of truth for implementation details. Do not duplicate information that can be discovered reliably from those files.

## Confirmed implementation constraints

- Build a modular monolith, not microservices.
- Use Angular 21 LTS, TypeScript, and Angular Material for the frontend, with Node.js 22 LTS.
- Use Java 21, Spring Boot 4.0.7, and Maven Wrapper for the backend.
- Use Spring Web and Bean Validation for the REST API.
- Use PostgreSQL 17 with Spring Data JPA/Hibernate.
- Use Flyway as the only owner of application schema changes and synthetic seed records.
- Use Spring Security with JWT and BCrypt for authentication and API-level RBAC.
- Implement the DICOM MWL SCP with dcm4che 5.34.x behind the DICOM adapter boundary.
- Use OpenAPI/Swagger for API documentation.
- Use JUnit 5, Spring Boot Test, and Testcontainers for backend tests, and Playwright for the critical end-to-end workflow.
- Deploy locally with Docker Compose and serve the production frontend through Nginx.
- Use GitHub Actions for continuous integration.

Do not introduce a separate Python service, microservices, an API gateway, MongoDB, Kafka, RabbitMQ, Redis, Kubernetes, Keycloak, or NgRx unless an explicit requirement justifies changing the confirmed architecture.

## Required behaviour

- Enforce the exam lifecycle on the server: `ORDERED -> SCHEDULED -> ACQUIRED -> REPORTED -> COMPLETED`.
- Reject invalid status transitions even if a client bypasses the UI.
- Treat DICOM MWL C-FIND as read-only. A successful query must not change exam status.
- Return only worklist entries matching supported query keys: modality, scheduled date/date range, and scheduled station AE title.
- Exclude cancelled exams from the active worklist and reflect rescheduling immediately.
- Enforce authentication and role-based access control at the API layer.
- Use synthetic patient and exam data only.
- Store application schema and synthetic demo data in ordered backend Flyway migrations, not PostgreSQL container initialization scripts.

## Architecture boundaries

- The RIS manages patients, orders, scheduling, workflow status, and reports.
- The RIS does not store or display medical images; that belongs to a PACS.
- Keep DICOM-specific types and protocol handling at the DICOM adapter boundary. Core workflow logic must not depend on DICOM datasets.
- Keep business rules out of HTTP controllers and UI components.
- Do not add HL7, PACS integration, structured reporting, cloud services, or other stretch features unless explicitly requested.

## Keeping context current

- Update `README.md` when project-level setup, confirmed technology choices, or run instructions change.
- Update `docs/architecture.md` when domain rules, system boundaries, component responsibilities, or important data relationships change.
- If documentation conflicts with implementation or the client brief, report the inconsistency instead of silently choosing one.
- Record rationale only for non-obvious decisions that a future contributor might otherwise undo.
