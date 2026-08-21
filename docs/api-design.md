# REST API Design

This document is the concise planning contract for frontend and backend work. Implemented request and response schemas are generated from Spring controller, DTO, validation, and OpenAPI annotations and exposed through Swagger UI.

## Generated API documentation

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`

These URLs are available while the backend is running locally.

## Conventions

- Base path: `/api`
- Media type: `application/json`
- Authentication: JWT bearer token except where marked public
- Identifiers: JSON numbers backed by database `BIGINT` values
- Dates: ISO `YYYY-MM-DD`; timestamps: ISO 8601 with an offset or `Z`
- List endpoints may gain pagination when required; the initial skeleton uses simple arrays.
- The backend, not the UI, enforces permissions and lifecycle rules.

Errors use the existing shape:

```json
{
  "timestamp": "2026-08-20T06:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Request validation failed.",
  "fieldErrors": {
    "fieldName": "validation message"
  }
}
```

Common responses are `400` invalid request, `401` unauthenticated, `403` unauthorized, `404` missing resource, and `409` duplicate data or invalid workflow state.

## Authentication

| Method and path | Access | Purpose |
|---|---|---|
| `POST /api/auth/login` | Public | Exchange username and password for a short-lived JWT and current user details |
| `GET /api/auth/me` | Authenticated | Return the current user, roles, and permissions |

## Patients

| Method and path | Permission | Purpose |
|---|---|---|
| `GET /api/patients` | `PATIENT_READ` | List or search patients |
| `GET /api/patients/{id}` | `PATIENT_READ` | Get one patient |
| `POST /api/patients` | `PATIENT_WRITE` | Register a synthetic patient |
| `PUT /api/patients/{id}` | `PATIENT_WRITE` | Update a patient |

Patient writes contain `medicalRecordNumber`, `firstName`, `lastName`, `dateOfBirth`, and `sex`. The existing `DELETE /api/patients/{id}` endpoint is not part of the target contract because clinical records should be retained; the team should remove it or explicitly approve deletion behavior before release.

## Exams and lifecycle

| Method and path | Permission | Purpose and lifecycle effect |
|---|---|---|
| `GET /api/exams` | `EXAM_READ` | List exams, optionally filtered by patient or status |
| `GET /api/exams/{id}` | `EXAM_READ` | Get an exam with its schedule and report summary |
| `POST /api/exams` | `ORDER_CREATE` | Create an exam in `ORDERED` |
| `PUT /api/exams/{id}/schedule` | `SCHEDULE_MANAGE` | Create or update the schedule; first scheduling changes `ORDERED -> SCHEDULED` |
| `POST /api/exams/{id}/cancel` | `EXAM_CANCEL` | Change `ORDERED` or `SCHEDULED` to `CANCELLED` |
| `POST /api/exams/{id}/acquire` | `EXAM_ACQUIRE` | Change `SCHEDULED -> ACQUIRED` |
| `POST /api/exams/{id}/report` | `REPORT_WRITE` | Submit report text and change `ACQUIRED -> REPORTED` |
| `POST /api/exams/{id}/complete` | `EXAM_COMPLETE` | Change `REPORTED -> COMPLETED` |

Exam creation contains `patientId`, `requestedProcedure`, and `modality`; the backend generates the accession number and initial status. Scheduling contains `scheduledStart` and `stationAeTitle`. Report submission contains only `reportText`; the authenticated user becomes the author.

Transition actions are idempotent only if explicitly implemented that way. Otherwise, a repeated or invalid transition returns `409 Conflict`, including for `ADMIN`.

## REST worklist

| Method and path | Permission | Purpose |
|---|---|---|
| `GET /api/worklist` | `WORKLIST_READ` | List active scheduled exams for the web UI |

Supported query parameters are `modality`, `scheduledDateFrom`, `scheduledDateTo`, and `stationAeTitle`. Cancelled exams are excluded. This REST endpoint does not replace the separate DICOM MWL C-FIND interface.

## Reports

| Method and path | Permission | Purpose |
|---|---|---|
| `GET /api/exams/{id}/report` | `REPORT_READ` | Retrieve the submitted report for an exam |

Submitted reports are read-only in the initial version.

## User administration

| Method and path | Permission | Purpose |
|---|---|---|
| `GET /api/users` | `USER_MANAGE` | List user accounts |
| `POST /api/users` | `USER_MANAGE` | Create a user account |
| `PUT /api/users/{id}/roles` | `USER_MANAGE` | Replace a user's fixed role assignments |
| `PATCH /api/users/{id}/enabled` | `USER_MANAGE` | Enable or disable an account |

The implementation must prevent disabling the final enabled administrator or removing their last `ADMIN` assignment.

## Documentation workflow

1. Agree on route or behavior changes in this document before implementation.
2. Implement DTO validation and controller behavior.
3. Add OpenAPI summaries, response codes, and security requirements to the controller.
4. Review the generated OpenAPI output in Swagger UI.
5. Update affected frontend calls and tests in the same feature workflow.
