# ADR-0001: Use a modular-monolith backend

- Status: Accepted
- Date: 2026-08-12
- Decision owners: COMP3888 P33 team

## Context

The RIS needs patient, examination, scheduling, workflow, reporting,
authentication, and DICOM capabilities, but the project is a small, locally
deployed university deliverable. Splitting these capabilities into separately
deployed services would add deployment and coordination cost without a
demonstrated requirement.

## Decision

Implement the backend as one Spring Boot modular monolith with explicit package
boundaries. Keep DICOM-specific types behind an adapter boundary while REST and
DICOM interfaces share the same application data.

## Consequences

- The application deploys as one backend service and uses one PostgreSQL
  database.
- Module boundaries remain visible in packages and service contracts.
- Microservices, an API gateway, separate Python DICOM service, message broker,
  Redis, and Kubernetes require a new demonstrated requirement and ADR.

## Evidence

- [`../../architecture.md`](../../architecture.md), confirmed technical
  architecture and component model.
- [`../../../README.md`](../../../README.md), technology decision dated
  12 August 2026.

## Supersedes / superseded by

None.
