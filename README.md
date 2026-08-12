# COMP3888_W10_03_P33
The final project topic and repository name are still being confirmed.

The repository will contain the team’s source code, documentation, setup instructions, and project deliverables.


## Getting Started

Copy the example environment file if you want to override the development defaults:

```bash
cp .env.example .env
```

Start the currently available PostgreSQL service:

```bash
docker compose up -d postgres
```

Run the backend in a second terminal:

```bash
cd backend
./mvnw spring-boot:run
```

Run the frontend in a third terminal:

```bash
cd frontend
npm start
```

Open `http://localhost:4200`. The page calls `http://localhost:8080/api/status`; the returned message is stored in PostgreSQL and created by Flyway migrations. Backend and frontend Docker services will be added to `compose.yaml` after their Dockerfiles exist.

## Repository Structure

```text
.
├── compose.yaml
├── backend/                         # Added with the Spring Boot application
├── frontend/                        # Added with the Angular application
├── ris-infra/
│   └── postgres/
│       └── init/
│           └── README.md             # Database-level initialization only
├── docs/
│   └── architecture.md
├── AGENTS.md
├── README.md
└── task-desc.md
```

The Compose file remains at the repository root so `docker compose up` works without an additional `-f` argument. Infrastructure-specific configuration belongs under `ris-infra/`. Application schema and synthetic demonstration data will be managed by Flyway under the backend rather than by PostgreSQL container initialization.

## Notes

Keep generated files, local environment files, dependencies, and build output out of version control.

## Links

### Google Docs
https://docs.google.com/spreadsheets/d/1HEHH2ZxKuwGS4Ovoqsu9-8QdREItgpg4mal8MpGYFrA/edit?usp=sharing

### Teams
https://teams.live.com/l/invite/FBApEuaB2I_zSZLOQ

### Jira


### Group Contract
https://unisydneyedu-my.sharepoint.com/:w:/g/personal/yxie0455_uni_sydney_edu_au/IQCl9f2Lt2AxTZLdeszH1cIWAXpNYZNy6xC6XxCdAYCH5Io?e=csLAic

## To Be Confirmed With the Client
Our current understanding is:

RIS manages patient/order/scheduling → exposes scheduled exams through DICOM MWL → `findscu` sends C-FIND → RIS returns the matching exam.

The C-FIND is read-only and does not mean the scan is completed. After that, we plan to simulate acquisition in the RIS with a “Mark as Acquired” action, then continue with reporting → completed.

Can you confirm whether this is correct, or whether the simulated modality must send a separate DICOM/HL7 message to automatically mark the exam as acquired?

## Current Project Context

This repository is for a lightweight, self-hosted Radiology Information System (RIS). The system manages synthetic patients, imaging exam orders, scheduling, a DICOM Modality Worklist, exam status, reporting, authentication, and role-based access control.

The RIS manages workflow and metadata. It does not store or display medical images; those responsibilities belong to a PACS.

### Core Workflow

```text
Register patient
    -> create exam order
    -> schedule exam
    -> modality queries DICOM MWL
    -> mark exam acquired
    -> write report
    -> complete exam
```

The server-enforced exam lifecycle is:

```text
ORDERED -> SCHEDULED -> ACQUIRED -> REPORTED -> COMPLETED
```

A DICOM C-FIND request is read-only. Returning a scheduled exam to `findscu` does not mean the examination was acquired and must not change its status.

### Core Requirements

- A containerised frontend, backend, and relational database started with Docker Compose.
- Patient registration, exam ordering and scheduling, reporting, and status tracking.
- A DICOM MWL SCP that exposes eligible scheduled exams.
- Correct C-FIND matching by modality, scheduled date/date range, and scheduled station AE title.
- Verification with a standard external client such as DCMTK `findscu`.
- Immediate worklist updates when an exam is rescheduled and withdrawal when it is cancelled.
- Authentication and API-enforced role-based access control.
- Automated tests for lifecycle rules, permissions, and worklist behaviour.
- Seeded synthetic data and an uninterrupted end-to-end demonstration.

### Confirmed Technology Stack

The team confirmed the following stack on 12 August 2026:

- Architecture: modular monolith
- Frontend: Angular 21 LTS, TypeScript, and Angular Material
- Frontend runtime/tooling: Node.js 22 LTS and Angular CLI
- Backend: Java 21 LTS and Spring Boot 4.0.7
- Backend build: Maven with Maven Wrapper
- REST API: Spring Web and Bean Validation
- Database: PostgreSQL 17
- Database access: Spring Data JPA/Hibernate
- Schema and seed migrations: Flyway
- Authentication and authorisation: Spring Security with JWT and BCrypt password hashing
- DICOM MWL: dcm4che 5.34.x embedded behind a DICOM adapter boundary
- DICOM verification: DCMTK `findscu`
- API documentation: OpenAPI/Swagger
- Backend testing: JUnit 5, Spring Boot Test, and Testcontainers
- Frontend/end-to-end testing: Angular test tooling and Playwright
- Deployment: Docker Compose with Nginx serving the frontend
- Continuous integration: GitHub Actions

The backend is organised into patient, exam, scheduling, workflow, reporting, authentication, and DICOM adapter modules. Do not introduce microservices, an API gateway, a separate Python DICOM service, MongoDB, message brokers, Redis, Kubernetes, Keycloak, or NgRx without a demonstrated requirement and an explicit architecture decision.

Application schema and synthetic demonstration records belong in ordered Flyway migrations, for example:

```text
backend/src/main/resources/db/migration/
├── V1__create_schema.sql
└── V2__seed_synthetic_demo_data.sql
```

### Scope Boundaries

The core project excludes image storage/viewing, real patient data, paid or cloud APIs, and a custom UI design system. HL7 v2 messaging, structured report templates, and integration with a PACS project are optional stretch goals.

### Architecture Context

Non-obvious domain rules and component boundaries are maintained in [`docs/architecture.md`](docs/architecture.md). Codex and other automated contributors should follow [`AGENTS.md`](AGENTS.md). The original client brief is available in [`task-desc.md`](task-desc.md).
