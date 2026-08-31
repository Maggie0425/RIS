# Backend workflows

Status: **Target**, with lifecycle transition methods and the technology-neutral
worklist query service already **Implemented**. Verify complete API and
persistence paths separately.

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

### Implemented core query semantics

The reusable backend worklist service accepts optional modality, inclusive
scheduled calendar-date bounds, and station AE-title filters. Supplied filters
use AND matching, station AE titles use exact case-sensitive matching, and only
examinations currently in `SCHEDULED` are eligible.

Calendar dates use the `Australia/Sydney` business timezone. The service
converts a supplied start date to the start of that Sydney day, inclusive, and
a supplied end date to the start of the following Sydney day, exclusive. This
half-open timestamp interval preserves inclusive calendar-date behaviour across
daylight-saving changes. Results are ordered by scheduled start and then exam
identifier.

The core result contains RIS patient, examination, and schedule values only.
REST serialization and DICOM dataset/tag mapping remain adapter concerns.

## Reporting

```text
ACQUIRED -> submit report -> REPORTED -> complete -> COMPLETED
```

The target design makes the authenticated backend user the report author. Exact
API intent is defined in [`../api-design.md`](../api-design.md); implemented
behaviour must be verified from controllers, DTOs, generated OpenAPI, and tests.
