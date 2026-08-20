# RIS Architecture Context

This document records domain rules and architectural boundaries that cannot be inferred reliably from build files or source code. Implementation details should remain in code, configuration, migrations, and tests.

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

## Component model

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

## Confirmed technical architecture

- Angular 21 LTS, TypeScript, and Angular Material form the frontend.
- Java 21 and Spring Boot 4.0.7 form the backend, built with Maven Wrapper.
- The backend is a modular monolith separated into patient, exam, scheduling, workflow, reporting, authentication, and DICOM adapter modules.
- PostgreSQL 17 is the single application database, accessed through Spring Data JPA/Hibernate.
- Flyway migrations are the source of truth for the application schema and synthetic demonstration records.
- Spring Security provides JWT authentication, BCrypt password hashing, and API-level RBAC.
- dcm4che 5.34.x provides DICOM networking and datasets within the DICOM adapter.
- OpenAPI/Swagger documents the REST API.
- Docker Compose runs the local system; Nginx serves the built frontend.
- GitHub Actions runs continuous integration checks.

Microservices, an API gateway, a separate Python DICOM service, MongoDB, message brokers, Redis, Kubernetes, Keycloak, and NgRx are intentionally excluded until a concrete requirement justifies their cost.

## Core workflow

```text
ORDERED -> SCHEDULED -> ACQUIRED -> REPORTED -> COMPLETED
```

Confirmed transition ownership:

- **Receptionist:** `ORDERED -> SCHEDULED`
- **Technologist:** `SCHEDULED -> ACQUIRED`
- **Radiologist:** `ACQUIRED -> REPORTED -> COMPLETED`

These permissions must be enforced through API-level role-based access control.

- Status transitions are validated by the backend, not merely by UI controls.
- Invalid transitions must be rejected.
- Scheduling supplies the date, time, modality, and scheduled station AE title required by MWL.
- Acquisition is a separate action after the modality discovers the exam and may be simulated through a RIS UI/API **Mark as Acquired** action. No acquisition result needs to be sent through the MWL query.

Cancellation is a terminal side path for an order that should no longer be performed. The client confirmed that cancellation is permitted only before an examination is acquired. Cancelled examinations must be excluded from the active worklist.

## DICOM Modality Worklist rules

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

The final database schema should be derived from these concepts after invariants and cardinalities are agreed. This document should describe relationships and intent; migrations remain the schema source of truth.

## Security and testing constraints

- Authentication and RBAC are enforced by the backend API.
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
