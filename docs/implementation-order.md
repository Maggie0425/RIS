# Recommended Implementation Order

Build the RIS as small end-to-end slices rather than completing every backend feature before starting the frontend.

1. Confirm the core workflow, lifecycle rules, roles, and permissions.
2. Model the domain and database; create schema and synthetic seed data with Flyway.
3. Define REST endpoints, DTOs, validation, errors, and OpenAPI contracts.
4. Implement and test the backend business rules, authentication, and API-level RBAC.
5. Build the matching Angular Material screens against the agreed API.
6. Add the DICOM MWL adapter once scheduling data is stable, ensuring C-FIND remains read-only.
7. Finish reporting, Playwright workflow tests, Docker deployment, CI, and documentation.

The first vertical slice should be:

```text
Flyway schema
-> create/search patient
-> order and schedule exam
-> retrieve the scheduled exam through REST
-> display it in Angular
```

Keep business rules in backend services, database changes in Flyway migrations, and DICOM-specific types inside the DICOM adapter boundary.
