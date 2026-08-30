# Backend local development

## Supported approaches

### Docker Compose

From the repository root:

```bash
cp -n .env.example .env
docker compose up --build postgres backend
```

Useful endpoints:

- API status: `http://localhost:8080/api/status`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`

### Local Spring Boot with Docker PostgreSQL

Start only PostgreSQL from the repository root:

```bash
docker compose up -d postgres
```

Then, from `backend/`:

```bash
./mvnw spring-boot:run
```

The default local datasource is `jdbc:postgresql://localhost:5432/ris`. Use
environment variables rather than committing local credentials.

## Useful diagnostics

```bash
docker compose ps
docker compose logs backend
docker compose logs postgres
curl http://localhost:8080/api/status
```

Inspect migration history:

```bash
docker compose exec postgres \
  psql -U ris -d ris \
  -c "SELECT installed_rank, version, description, success
      FROM flyway_schema_history
      ORDER BY installed_rank;"
```

For team-wide installation and frontend instructions, use
[`../../README.md`](../../README.md).
