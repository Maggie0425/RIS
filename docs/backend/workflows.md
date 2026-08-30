# Backend workflows

Status: **Target**, with lifecycle transition methods already **Implemented** in
the domain model. Verify complete API and persistence paths separately.

## Main examination lifecycle

```text
ORDERED -> SCHEDULED -> ACQUIRED -> REPORTED -> COMPLETED
```

- The backend validates every transition.
- Permission to perform an action does not make an invalid transition valid.
- Cancellation is a terminal side path allowed only before acquisition.
- Cancelled examinations are excluded from the active worklist.

## Modality Worklist query

```text
Scheduled exam
  -> modality or findscu sends C-FIND
  -> RIS matches modality, scheduled date/range, and station AE title
  -> RIS returns eligible scheduled entries
```

C-FIND is read-only. Receiving or answering the query must not mark an
examination as acquired. Rescheduling changes later query results; cancellation
withdraws the entry.

## Reporting

```text
ACQUIRED -> submit report -> REPORTED -> complete -> COMPLETED
```

The target design makes the authenticated backend user the report author. Exact
API intent is defined in [`../api-design.md`](../api-design.md); implemented
behaviour must be verified from controllers, DTOs, generated OpenAPI, and tests.
