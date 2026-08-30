# RIS Architecture Context

Status: **Target architecture**, except where a section is explicitly labelled
**Implemented**. Status labels and source authority are defined in
[`README.md`](README.md).

This document records domain rules and architectural boundaries that cannot be
inferred reliably from build files or source code. Implementation details
remain authoritative in code, configuration, migrations, generated contracts,
and tests.

## System boundary

The Radiology Information System (RIS) manages:

- synthetic patient registration;
- imaging exam orders;
- exam scheduling;
- DICOM Modality Worklist exposure;
- exam status tracking;
- radiology reports;
- authentication and role-based access control.

Medical image acquisition, storage, retrieval, and viewing are outside the RIS boundary and belong to a PACS.

## Target component model

```text
Web browser
    |
    | HTTP/JSON
    v
Angular frontend
    |
    v
Spring Boot modular monolith -> PostgreSQL 17
    |
    +-- REST API :8080
    |
    +-- dcm4che MWL adapter :11112
             ^
             | DICOM C-FIND
      findscu / modality
```

The web frontend uses the REST API. A modality or `findscu` uses the separate DICOM MWL interface. Both interfaces operate on the same RIS scheduling data.

## Approved technical direction

### Implemented foundation

- Angular 21, TypeScript, and Angular Material form the frontend.
- Java 21 and Spring Boot 4.0.7 form the backend, built with Maven Wrapper.
- Backend packages establish patient, exam, scheduling, workflow, reporting,
  authentication, API, and DICOM adapter boundaries.
- PostgreSQL 17 is the application database, accessed through Spring Data
  JPA/Hibernate.
- Flyway migrations are the source of truth for the application schema and
  synthetic demonstration records.
- OpenAPI/Swagger generates documentation for implemented REST controllers.
- Docker Compose runs PostgreSQL, the backend, pgAdmin, and the Nginx-served
  frontend.
- Read-only REST slices expose patient CRUD, examination listing with status
  filtering, and dashboard counts grouped across every lifecycle status.

### Target integrations

- Spring Security will provide JWT authentication, BCrypt password handling,
  and API-level RBAC.
- dcm4che 5.34.x will provide DICOM networking and datasets within the DICOM
  adapter.
- DCMTK `findscu` will verify MWL matching.
- Testcontainers and Playwright will extend integration and end-to-end testing.
- GitHub Actions will run continuous integration checks.

Microservices, an API gateway, a separate Python DICOM service, MongoDB, message brokers, Redis, Kubernetes, Keycloak, and NgRx are intentionally excluded until a concrete requirement justifies their cost.

## Target core workflow

```text
ORDERED -> SCHEDULED -> ACQUIRED -> REPORTED -> COMPLETED
```

Confirmed transition ownership:

- **Receptionist:** `ORDERED -> SCHEDULED`
- **Technologist:** `SCHEDULED -> ACQUIRED`
- **Radiologist:** `ACQUIRED -> REPORTED -> COMPLETED`

These permissions must be enforced through API-level role-based access control.

- Lifecycle transition methods are **Implemented** in the examination domain
  model. Complete API, authorization, and persistence paths remain **Target**.
- Status transitions must be validated by the backend, not merely by UI controls.
- Invalid transitions must be rejected.
- Scheduling supplies the date, time, modality, and scheduled station AE title required by MWL.
- Acquisition is a separate action after the modality discovers the exam and may be simulated through a RIS UI/API **Mark as Acquired** action. No acquisition result needs to be sent through the MWL query.

Cancellation is a terminal side path for an order that should no longer be performed. The client confirmed that cancellation is permitted only before an examination is acquired. Cancelled examinations must be excluded from the active worklist.

## DICOM Modality Worklist rules — Target

The RIS acts as a DICOM MWL Service Class Provider (SCP). A simulated modality or DCMTK `findscu` acts as the Service Class User (SCU).

C-FIND is read-only:

- receiving a query does not schedule an exam;
- returning a match does not mark it acquired;
- final C-FIND success means the query completed, not that imaging occurred.

The MWL SCP must support matching on:

- modality type;
- scheduled date or date range;
- scheduled station AE title.

Only eligible scheduled exams are returned. Rescheduling must change subsequent query results, and cancelled exams must be withdrawn from the active worklist.

The mapping between RIS fields and DICOM tags must be documented when the domain fields are finalised.

## Initial domain concepts

- **Patient:** synthetic demographic and local identifier data.
- **Exam order:** requested imaging procedure, accession number, and lifecycle status.
- **Schedule:** planned date/time, modality, and station for an exam order.
- **Report:** radiologist-authored result associated with an acquired exam.
- **User and role:** authenticated actor and API permissions.

The database-backed RBAC tables, fixed permission catalogue, and role mappings are defined in [Database-Backed RBAC Design](rbac-design.md). Administrators have every permission and may assign fixed roles, but custom permission editing is outside the core scope.

The physical database schema is implemented through Flyway. This document
describes relationships and intent; migrations remain the schema source of
truth.

## Security and testing constraints — Target

- Authentication and RBAC must be enforced by the backend API; database RBAC
  foundations alone do not provide enforcement.
- Test coverage must include valid and invalid lifecycle transitions, role permissions, MWL matching, rescheduling, and cancellation/withdrawal.
- Only synthetic records may be seeded or used in demonstrations.

## Out of scope for the core delivery

- PACS image storage or viewing;
- real patient data;
- a custom design system;
- paid or cloud APIs;
- HL7 v2 messaging;
- structured report templates;
- joint PACS integration.

The last three items are optional stretch goals only.
