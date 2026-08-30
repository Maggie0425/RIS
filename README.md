# COMP3888_W10_03_P33

This repository contains the team’s lightweight, self-hosted Radiology
Information System (RIS), documentation, setup instructions, and project
deliverables.


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
- Open Swagger UI at `http://localhost:8080/swagger-ui.html`.
- View the generated OpenAPI JSON at `http://localhost:8080/api-docs`.
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
├── AGENTS.md                       # Concise Codex project rules and navigation
├── compose.yaml
├── backend/                         # Spring Boot application and backend rules
├── frontend/                        # Angular application
├── ris-infra/
│   └── postgres/
│       └── init/
│           └── README.md            # Database-level initialization only
├── docs/
│   ├── README.md                    # Documentation map and source authority
│   ├── architecture.md
│   ├── api-design.md
│   ├── database-workflow.md
│   ├── development-workflow.md
│   ├── task-desc.md                 # Original client brief
│   └── backend/                     # Backend knowledge base and ADRs
└── README.md
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

## Current Project Context

This repository is for a lightweight, self-hosted Radiology Information System
(RIS). The target system manages synthetic patients, imaging exam orders,
scheduling, a DICOM Modality Worklist, exam status, reporting, authentication,
and role-based access control.

The RIS manages workflow and metadata. It does not store or display medical images; those responsibilities belong to a PACS.

### Implementation and target status

The documentation uses **Implemented**, **Target**, **Proposed**, and **TBC** as
defined in [`docs/README.md`](docs/README.md). Source, migrations, generated
OpenAPI, and tests take precedence over planning summaries.

- **Implemented foundation:** Angular, Java 21/Spring Boot 4.0.7, Maven Wrapper,
  PostgreSQL 17, JPA, Flyway migrations, Docker Compose, patient CRUD, domain
  lifecycle methods, read-only exam listing, dashboard workflow summaries and
  navigation, and generated OpenAPI for implemented controllers.
- **Target:** Spring Security/JWT enforcement, examination and workflow APIs,
  beyond the implemented read-only views, scheduling, reporting, DICOM MWL
  through dcm4che, DCMTK verification, Testcontainers integration coverage,
  Playwright end-to-end coverage, and GitHub Actions CI.

The complete workflow, module boundaries, approved technology direction, and
excluded infrastructure are maintained in
[`docs/architecture.md`](docs/architecture.md). The current backend boundary is
summarised in [`docs/backend/README.md`](docs/backend/README.md) and must be
verified against source before status reporting.

### Scope Boundaries

The core project excludes image storage/viewing, real patient data, paid or cloud APIs, and a custom UI design system. HL7 v2 messaging, structured report templates, and integration with a PACS project are optional stretch goals.

### Architecture Context

Start with the documentation map in [`docs/README.md`](docs/README.md).
Non-obvious domain rules and component boundaries are maintained in
[`docs/architecture.md`](docs/architecture.md). The original client brief is
available in [`docs/task-desc.md`](docs/task-desc.md).

### Team Development

The branch, commit, review, and pull request process is documented in [`docs/development-workflow.md`](docs/development-workflow.md).

### Database Development

The Flyway migration and pgAdmin usage process is documented in [`docs/database-workflow.md`](docs/database-workflow.md).
