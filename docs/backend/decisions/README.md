# Backend architecture decisions

Use an ADR for a durable choice that affects multiple features, public
contracts, data compatibility, security, or deployment.

## Status values

- Proposed
- Accepted
- Superseded by ADR-NNNN
- Rejected

## Index

| ADR | Status | Decision |
|---|---|---|
| [0001](0001-modular-monolith.md) | Accepted | Use a modular-monolith backend |
| [0002](0002-flyway-schema-authority.md) | Accepted | Use Flyway as the application schema authority |
| [0003](0003-mwl-c-find-is-read-only.md) | Accepted | Keep MWL C-FIND read-only |

## Template

```md
# ADR-NNNN: Short decision title

- Status: Proposed
- Date: YYYY-MM-DD
- Decision owners: team/client/tutor as applicable

## Context

What problem or constraint requires a durable decision?

## Decision

What was decided?

## Consequences

What becomes easier, harder, required, or excluded?

## Evidence

Link to the approved source, client note, pull request, test, or benchmark.

## Supersedes / superseded by

State the relationship or `None`.
```

Do not use ADRs for daily status, implementation notes, personal preferences,
or decisions that have not actually been approved.
