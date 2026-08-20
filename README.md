# COMP3888_W10_03_P33
The final project topic and repository name are still being confirmed.

The repository will contain the team’s source code, documentation, setup instructions, and project deliverables.


## Team Setup

The minimum local setup is **Git + Docker Desktop**. Java, Maven, Node.js, Angular CLI, PostgreSQL, and Nginx do not need to be installed locally because Docker builds and runs them.

### Windows with WSL 2

1. Install Git inside the Ubuntu distribution:

   ```bash
   sudo apt update
   sudo apt install -y git
   ```

2. Install and start Docker Desktop for Windows.
3. In Docker Desktop, enable **Settings → General → Use the WSL 2 based engine**.
4. Enable **Settings → Resources → WSL Integration → Ubuntu**, then apply and restart.
5. Verify from the WSL terminal:

   ```bash
   git --version
   docker version
   docker compose version
   ```

Clone the repository inside the WSL filesystem, such as under `~/projects`, rather than `/mnt/c`, for better Docker build performance.

### macOS

1. Install Git if it is not already available:

   ```bash
   xcode-select --install
   ```

2. Install and start Docker Desktop for Mac.
3. Verify from Terminal:

   ```bash
   git --version
   docker version
   docker compose version
   ```

### Start the project

From the repository root:

```bash
cp -n .env.example .env
docker compose up --build
```

The first build downloads the Java, Node.js, Nginx, PostgreSQL, and pgAdmin images and may take several minutes. Later builds reuse Docker's cache.

When all services are running:

- Open `http://localhost:4200`.
- Open pgAdmin at `http://localhost:5050` and sign in with the credentials from `.env`.
- Verify the API with `curl http://localhost:4200/api/status`.
- Expect the page and API to report that Angular, Spring Boot, and PostgreSQL are connected.

To connect pgAdmin to the project database, register a server with:

- Host name: `postgres`
- Port: `5432`
- Maintenance database, username, and password: the `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` values from `.env`

Use `postgres`, not `localhost`, as the database host because pgAdmin and PostgreSQL communicate through the Compose network.

Press `Ctrl+C` and run the following to stop the project without deleting database data:

```bash
docker compose down
```

To run in the background instead:

```bash
docker compose up -d --build
docker compose logs -f
```

Useful diagnostics:

```bash
docker compose ps
docker compose logs backend
docker compose logs postgres
docker compose logs pgadmin
```

If ports `4200`, `5050`, `8080`, or `5432` are already in use, stop the conflicting process or change the corresponding setting in `.env` before starting Compose.

### Optional local development tools

Only install Java 21 and Node.js 22 if you want to run Angular or Spring Boot outside Docker for faster hot reload. They are not required for the minimum team setup. Angular's local development proxy and Nginx in Docker both route `/api` to the backend.

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
│   ├── architecture.md
│   ├── database-workflow.md
│   └── development-workflow.md
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
 m
The core project excludes image storage/viewing, real patient data, paid or cloud APIs, and a custom UI design system. HL7 v2 messaging, structured report templates, and integration with a PACS project are optional stretch goals.

### Architecture Context

Non-obvious domain rules and component boundaries are maintained in [`docs/architecture.md`](docs/architecture.md). The original client brief is available in [`task-desc.md`](task-desc.md).

### Team Development

The branch, commit, review, and pull request process is documented in [`docs/development-workflow.md`](docs/development-workflow.md).

### Database Development

The Flyway migration and pgAdmin usage process is documented in [`docs/database-workflow.md`](docs/database-workflow.md).
