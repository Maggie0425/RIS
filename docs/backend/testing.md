# Backend testing

## Test levels

1. **Domain unit tests**
   - Lifecycle transitions and other pure business rules.
   - No Spring context or database unless required.
2. **Service tests**
   - Validation, normalization, duplicate handling, missing records, and
     transaction behaviour.
   - Mock repositories only when persistence behaviour is not the subject.
3. **Controller/API tests**
   - Routes, request validation, response status, error shape, and serialization.
   - Add authorization cases when Spring Security is implemented.
4. **Database and migration tests**
   - Apply every Flyway migration to a clean PostgreSQL database.
   - Inspect `flyway_schema_history`.
   - Directly prove important constraints accept valid data and reject invalid
     data.
5. **Integration and end-to-end tests**
   - Run against PostgreSQL.
   - Cover the uninterrupted patient -> order -> schedule -> worklist ->
     acquisition -> report -> completion workflow.
   - Test MWL matching with an external DICOM client when implemented.

## Commands

From `backend/`:

```bash
./mvnw test
```

For focused iteration:

```bash
./mvnw -Dtest=ExamLifecycleTest test
./mvnw -Dtest=PatientServiceTest,PatientControllerTest test
```

From the repository root, bring up PostgreSQL when the Spring context or
database integration requires it:

```bash
docker compose up -d postgres
cd backend
./mvnw test
```

## Reporting evidence

Always report:

- exact command;
- passed, failed, and skipped tests;
- database/runtime prerequisites;
- which acceptance boundary remains untested.

A focused green suite is not evidence that the full application-context suite
passed.
